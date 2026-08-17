/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/prefer-optional-chain, @typescript-eslint/return-await, @typescript-eslint/use-unknown-in-catch-callback-variable, @typescript-eslint/non-nullable-type-assertion-style */
import {
  artifactContract,
  validateArtifactManifest,
} from "./artifactPolicy.js";
import { canonicalJsonDigest } from "./canonicalManifest.js";
import {
  COMPILATION_CLOSED_REASONS,
  compilationPlan,
  createArtifactVerificationLease,
  type CompilationClosedReason,
  type ExactCapabilityV1,
} from "./contracts.js";
import type {
  AnchoredLedgerReservationV1,
  BrokerQuarantineV1,
  CapabilityConsumptionReceiptV1,
  CleanupEvidenceV1,
  CompilationCoordinatorPorts,
  CompilationOperationContextV1,
  CompilationOperationV1,
  CompilationPhaseV1,
  CompilationScopeV1,
  LedgerAnchorV1,
  ReleaseReconciliationReceiptV1,
  VerificationConsumptionReceiptV1,
  WorkerAllocationV1,
} from "./ports.js";
import { validateSourceManifest } from "./sourcePolicy.js";

export interface CompilationCoordinatorRequestV1 {
  readonly schemaVersion: "compilation-coordinator-request-v1";
  readonly operationId: string;
  readonly scope: CompilationScopeV1;
  readonly expectedLedgerDigest: string;
  readonly expectedLedgerRevision: number;
  readonly budgetDigest: string;
  readonly planId: string;
  readonly leaseId: string;
  readonly now: Date;
}
export interface CompilationCoordinatorResultV1 {
  readonly state: "released" | "quarantined" | "failed";
  readonly reason: CompilationClosedReason | null;
  readonly ledgerDigest: string;
  readonly ledgerRevision: number;
  readonly artifactAggregateDigest: string | null;
}
interface StoredTerminalV1 {
  readonly publicResult: CompilationCoordinatorResultV1;
  readonly context: CompilationOperationContextV1;
}
const opaque = /^[a-z0-9_-]{22,128}$/,
  digest = /^[a-f0-9]{64}$/;

export class CompilationCoordinator {
  readonly #inflight = new Map<
    string,
    { digest: string; promise: Promise<CompilationCoordinatorResultV1> }
  >();
  constructor(
    private readonly ports: CompilationCoordinatorPorts | null,
    private readonly boundaryTimeoutMs = 600000,
  ) {
    if (
      !Number.isSafeInteger(boundaryTimeoutMs) ||
      boundaryTimeoutMs < 1 ||
      boundaryTimeoutMs > 600000
    )
      throw new Error("Coordinator timeout invalid.");
  }
  async compile(value: unknown): Promise<CompilationCoordinatorResultV1> {
    const request = validateRequest(value),
      requestDigest = coordinatorRequestDigest(request);
    if (this.ports === null) return failed("disabled", request);
    const local = this.#inflight.get(request.operationId);
    if (local)
      return local.digest === requestDigest
        ? local.promise
        : failed("routeStale", request);
    const promise = this.#start(request, requestDigest).finally(() =>
      this.#inflight.delete(request.operationId),
    );
    this.#inflight.set(request.operationId, { digest: requestDigest, promise });
    return promise;
  }
  async #start(
    request: CompilationCoordinatorRequestV1,
    requestDigest: string,
  ): Promise<CompilationCoordinatorResultV1> {
    const ports = this.ports!;
    let operation = await ports.operations.load(request.operationId);
    if (operation) {
      validateStoredOperation(operation);
      if (operation.requestDigest !== requestDigest)
        return failed("routeStale", request);
      if (operation.state !== "running")
        return storedResult(operation).publicResult;
      return this.#recover(request, operation);
    }
    const checkpoint: CompilationOperationContextV1 = {
      scope: request.scope,
      generation: 1,
      phase: "created",
      reservation: null,
      allocation: null,
      anchor: {
        ledgerDigest: request.expectedLedgerDigest,
        revision: request.expectedLedgerRevision,
      },
      cleanup: null,
      artifact: null,
      artifactDigest: null,
      broker: null,
      brokerDigest: null,
      egress: null,
      egressDigest: null,
      terminalIntent: null,
      terminalIntentDigest: null,
    };
    operation = {
      operationId: request.operationId,
      requestDigest,
      state: "running",
      resultDigest: null,
      result: null,
      checkpointDigest: canonicalJsonDigest(checkpoint),
      checkpoint,
      revision: 0,
    };
    if (!(await ports.operations.create(operation))) {
      operation = await ports.operations.load(request.operationId);
      if (!operation) return failed("budgetUnavailable", request);
      validateStoredOperation(operation);
      if (operation.requestDigest !== requestDigest)
        return failed("routeStale", request);
      return operation.state === "running"
        ? this.#recover(request, operation)
        : storedResult(operation).publicResult;
    }
    return this.#run(request, operation);
  }
  async #recover(
    request: CompilationCoordinatorRequestV1,
    operation: CompilationOperationV1,
  ): Promise<CompilationCoordinatorResultV1> {
    const prior = operation.checkpoint!;
    let current = await this.#checkpoint(operation, {
      ...prior,
      generation: prior.generation + 1,
    });
    const generation = current.checkpoint!.generation,
      signal = new AbortController().signal;
    let anchor = prior.anchor,
      cleanup = prior.cleanup,
      reason: CompilationClosedReason = "cleanupUncertain";
    if (prior.phase === "ledgerReleased" && prior.terminalIntent) {
      const intent = prior.terminalIntent,
        publicResult = result(
          intent.state,
          intent.reason,
          anchor,
          intent.artifactAggregateDigest,
        );
      return this.#terminal(current, publicResult, { ...prior, generation });
    }
    if (
      prior.phase === "artifactReleased" &&
      prior.terminalIntent &&
      prior.reservation
    ) {
      try {
        anchor = await this.#invoke(
          generation,
          (context) =>
            this.ports!.ledger.release(
              prior.scope,
              prior.reservation!,
              anchor,
              context,
            ),
          (late) =>
            this.#convergeLedgerReleased(operation.operationId, late).then(
              () => undefined,
            ),
        );
      } catch (releaseError) {
        const receipt = await this.#invoke(generation, (context) =>
          this.ports!.ledger.reconcileRelease(
            operation.operationId,
            prior.scope,
            prior.reservation!,
            anchor,
            context,
          ),
        );
        anchor = validateReleaseReconciliation(
          receipt,
          operation.operationId,
          prior.reservation.reservationId,
          generation,
          anchor,
        );
        void releaseError;
      }
      current = await this.#convergeLedgerReleased(
        operation.operationId,
        anchor,
      );
      const intent = prior.terminalIntent;
      return this.#terminal(
        current,
        result(
          intent.state,
          intent.reason,
          anchor,
          intent.artifactAggregateDigest,
        ),
        current.checkpoint!,
      );
    }
    const brokerPhase =
      prior.phase === "brokerCopied" ||
      prior.phase === "cleaned" ||
      prior.phase === "egressAuthorized" ||
      prior.phase === "ledgerSettled";
    if (brokerPhase && prior.broker) {
      try {
        await this.ports!.broker.revoke(
          prior.scope,
          prior.broker,
          generation,
          signal,
        );
      } catch {}
      if (prior.cleanup) {
        try {
          anchor = await this.ports!.ledger.retain(
            prior.scope,
            prior.reservation!,
            anchor,
            generation,
            signal,
          );
        } catch {}
        const context = { ...prior, generation, anchor };
        return this.#terminal(
          current,
          result("quarantined", "cleanupUncertain", anchor, null),
          context,
        );
      }
    }
    if (prior.reservation && prior.allocation) {
      try {
        cleanup = await this.#invoke(generation, (context) =>
          this.ports!.cleanup.cleanupOnce(
            request.operationId,
            prior.scope,
            prior.allocation!,
            context,
          ),
        );
        assertCleanup(prior.allocation, cleanup);
        anchor = cleanup.certain
          ? await this.#invoke(generation, (context) =>
              this.ports!.ledger.settle(
                prior.scope,
                prior.reservation!,
                prior.allocation!,
                cleanup!,
                anchor,
                context,
              ),
            )
          : await this.#invoke(() =>
              this.ports!.ledger.retain(
                prior.scope,
                prior.reservation!,
                anchor,
                generation,
                signal,
              ),
            );
      } catch {
        try {
          anchor = await this.#invoke(() =>
            this.ports!.ledger.retain(
              prior.scope,
              prior.reservation!,
              anchor,
              generation,
              signal,
            ),
          );
        } catch {}
      }
    } else if (prior.reservation) {
      try {
        anchor = await this.#invoke(() =>
          this.ports!.ledger.retain(
            prior.scope,
            prior.reservation!,
            anchor,
            generation,
            signal,
          ),
        );
      } catch {
        reason = "budgetUnavailable";
      }
    }
    const context = {
      ...prior,
      generation: current.checkpoint!.generation,
      anchor,
      cleanup,
    };
    return this.#terminal(
      current,
      result(prior.allocation ? "quarantined" : "failed", reason, anchor, null),
      context,
    );
  }
  async #run(
    request: CompilationCoordinatorRequestV1,
    initial: CompilationOperationV1,
  ): Promise<CompilationCoordinatorResultV1> {
    const ports = this.ports!,
      generation = initial.checkpoint!.generation,
      signal = new AbortController().signal;
    let operation = initial,
      reservation: AnchoredLedgerReservationV1 | undefined,
      allocation: WorkerAllocationV1 | undefined,
      broker: BrokerQuarantineV1 | undefined,
      cleanup: CleanupEvidenceV1 | undefined,
      anchor = initial.checkpoint!.anchor,
      artifactDigest: string | null = null,
      artifactCheckpoint: CompilationOperationContextV1["artifact"] = null,
      egressCheckpoint: CompilationOperationContextV1["egress"] = null,
      terminalIntent: CompilationOperationContextV1["terminalIntent"] = null,
      cleanupBoundaryTimedOut = false,
      settleBoundaryTimedOut = false,
      terminalizing = false;
    const save = async (phase: CompilationPhaseV1) => {
      const artifactCheckpointDigest = artifactCheckpoint
          ? canonicalJsonDigest(artifactCheckpoint)
          : null,
        brokerCheckpoint = broker ?? null,
        egressCheckpointDigest = egressCheckpoint
          ? canonicalJsonDigest(egressCheckpoint)
          : null,
        terminalIntentCheckpointDigest = terminalIntent
          ? canonicalJsonDigest(terminalIntent)
          : null;
      operation = await this.#checkpoint(operation, {
        scope: request.scope,
        generation,
        phase,
        reservation: reservation ?? null,
        allocation: allocation ?? null,
        anchor,
        cleanup: cleanup ?? null,
        artifact: artifactCheckpoint,
        artifactDigest: artifactCheckpointDigest,
        broker: brokerCheckpoint,
        brokerDigest: brokerCheckpoint
          ? canonicalJsonDigest(brokerCheckpoint)
          : null,
        egress: egressCheckpoint,
        egressDigest: egressCheckpointDigest,
        terminalIntent,
        terminalIntentDigest: terminalIntentCheckpointDigest,
      });
    };
    try {
      reservation = await this.#invoke(
        generation,
        (context) => ports.admission.reserve(request.scope, anchor, context),
        async (late) => {
          await ports.ledger.release(request.scope, late, anchorFrom(late), {
            generation,
            signal: new AbortController().signal,
          });
        },
      );
      anchor = anchorFrom(reservation);
      await save("reserved");
      const admission = (await ports.capabilities.issue(
        {
          operationId: request.operationId,
          generation,
          capability: {
            schemaVersion: "admission-capability-v1",
            jobId: request.scope.jobId,
            tenantId: request.scope.tenantId,
            projectId: request.scope.projectId,
            target: request.scope.target,
            routeRequirementDigest: request.scope.routeRequirementDigest,
            budgetDigest: request.budgetDigest,
            phase: "admission",
          },
        },
        signal,
      )) as Extract<ExactCapabilityV1, { phase: "admission" }>;
      const acquire = () =>
        this.#invoke(
          generation,
          async (context) => {
            const value = await ports.admission.acquire(
              request.scope,
              reservation!,
              { capability: admission, ...context },
            );
            return {
              generation:
                value.kind === "acquired"
                  ? value.effect.generation
                  : value.generation,
              value,
            };
          },
          async (late) => {
            if (late.kind === "acquired")
              await ports.cleanup.cleanupOnce(
                request.operationId,
                request.scope,
                late,
                { generation, signal: new AbortController().signal },
              );
          },
        );
      let acquired = await acquire();
      if (acquired.kind !== "acquired") {
        assertDefinitelyNoCreate(
          acquired,
          request.operationId,
          generation,
          reservation.reservationId,
        );
        reservation = await this.#invoke(
          generation,
          (context) =>
            ports.ledger.retryBeforeCreate(
              request.scope,
              reservation!,
              anchor,
              context,
            ),
          async (late) => {
            await ports.ledger.release(request.scope, late, anchorFrom(late), {
              generation,
              signal: new AbortController().signal,
            });
          },
        );
        anchor = anchorFrom(reservation);
        await save("reserved");
        acquired = await acquire();
        if (acquired.kind !== "acquired") throw failure("cleanupUncertain");
      }
      validateConsumption(
        await ports.capabilities.consume(
          admission,
          acquired.effect,
          request.operationId,
          generation,
          signal,
        ),
        admission,
        generation,
      );
      allocation = {
        resourceIdDigest: acquired.resourceIdDigest,
        workerEvidenceDigest: acquired.workerEvidenceDigest,
      };
      await save("allocated");
      anchor = await this.#invoke(
        generation,
        (context) =>
          ports.ledger.observeCreate(
            request.scope,
            reservation!,
            anchor,
            context,
          ),
        async (late) => {
          await ports.ledger.retain(
            request.scope,
            reservation!,
            late,
            generation,
            new AbortController().signal,
          );
        },
      );
      await save("observed");
      const manifest = validateSourceManifest(
        await this.#invoke(
          generation,
          (context) => ports.source.seal(request.scope, context),
          (late) => {
            validateSourceManifest(late);
            return Promise.resolve();
          },
        ),
      );
      assertManifestScope(request.scope, manifest);
      await save("sealed");
      const manifestDigest = canonicalJsonDigest(manifest),
        ingress = (await ports.capabilities.issue(
          {
            operationId: request.operationId,
            generation,
            capability: {
              schemaVersion: "source-ingress-capability-v1",
              jobId: request.scope.jobId,
              tenantId: request.scope.tenantId,
              projectId: request.scope.projectId,
              target: request.scope.target,
              routeRequirementDigest: request.scope.routeRequirementDigest,
              sourceManifestDigest: manifestDigest,
              sourceAggregateDigest: manifest.sourceAggregateDigest,
              workerEvidenceDigest: allocation.workerEvidenceDigest,
              phase: "source_ingress",
            },
          },
          signal,
        )) as Extract<ExactCapabilityV1, { phase: "source_ingress" }>;
      const ingressEffect = await this.#invoke(
        generation,
        async (context) => {
          const value = await ports.source.ingress(
            request.scope,
            allocation!,
            manifest,
            { capability: ingress, ...context },
          );
          return { generation: value.generation, value };
        },
        async () => {
          await ports.capabilities.revoke(
            ingress,
            request.operationId,
            generation,
            new AbortController().signal,
          );
          await ports.cleanup.cleanupOnce(
            request.operationId,
            request.scope,
            allocation!,
            { generation, signal: new AbortController().signal },
          );
        },
      );
      validateConsumption(
        await ports.capabilities.consume(
          ingress,
          ingressEffect,
          request.operationId,
          generation,
          signal,
        ),
        ingress,
        generation,
      );
      await save("ingressed");
      const contract = artifactContract(request.scope.target),
        plan = compilationPlan(
          request.scope.target === "astro_web"
            ? "astro_web_v1"
            : "flutter_web_v1",
          request.planId,
          request.scope.jobId,
        ),
        execution = (await ports.capabilities.issue(
          {
            operationId: request.operationId,
            generation,
            capability: {
              schemaVersion: "execution-capability-v1",
              jobId: request.scope.jobId,
              tenantId: request.scope.tenantId,
              projectId: request.scope.projectId,
              target: request.scope.target,
              routeRequirementDigest: request.scope.routeRequirementDigest,
              sourceAggregateDigest: manifest.sourceAggregateDigest,
              workerEvidenceDigest: allocation.workerEvidenceDigest,
              planDigest: plan.planDigest,
              artifactContractDigest: contract.contractDigest,
              phase: "execution",
            },
          },
          signal,
        )) as Extract<ExactCapabilityV1, { phase: "execution" }>;
      const executionResult = await this.#invoke(
        generation,
        async (context) => {
          const value = await ports.sandbox.execute(
            {
              scope: request.scope,
              allocation: allocation!,
              plan: plan.plan,
              planDigest: plan.planDigest,
              sourceAggregateDigest: manifest.sourceAggregateDigest,
              artifactContractDigest: contract.contractDigest,
              timeoutMs: 600000,
            },
            { capability: execution, ...context },
          );
          return { generation: value.effect.generation, value };
        },
        async () => {
          await ports.capabilities.revoke(
            execution,
            request.operationId,
            generation,
            new AbortController().signal,
          );
          await ports.cleanup.cleanupOnce(
            request.operationId,
            request.scope,
            allocation!,
            { generation, signal: new AbortController().signal },
          );
        },
      );
      validateConsumption(
        await ports.capabilities.consume(
          execution,
          executionResult.effect,
          request.operationId,
          generation,
          signal,
        ),
        execution,
        generation,
      );
      assertDigest(executionResult.stdoutDigest, "executionFailed");
      assertDigest(executionResult.stderrDigest, "executionFailed");
      await save("executed");
      const lease = createArtifactVerificationLease({
          leaseId: request.leaseId,
          jobId: request.scope.jobId,
          tenantId: request.scope.tenantId,
          projectId: request.scope.projectId,
          target: request.scope.target,
          routeRequirementDigest: request.scope.routeRequirementDigest,
          artifactContractDigest: contract.contractDigest,
          providerResourceIdDigest: allocation.resourceIdDigest,
          workerEvidenceDigest: allocation.workerEvidenceDigest,
          issuedAt: request.now.toISOString(),
          expiresAt: plus(request.now, 300000),
        }),
        artifact = await this.#invoke(
          generation,
          (context) =>
            ports.verifier.verify(request.scope, allocation!, lease, context),
          async () => {
            lease.revoke();
            await ports.cleanup.cleanupOnce(
              request.operationId,
              request.scope,
              allocation!,
              { generation, signal: new AbortController().signal },
            );
          },
        );
      validateVerification(
        artifact.consumption,
        lease.leaseId,
        lease.leaseDigest,
        generation,
      );
      if (lease.state !== "consumed") throw failure("artifactUnproved");
      assertArtifactScope(
        request.scope,
        manifest.sourceAggregateDigest,
        artifact.manifest,
      );
      validateArtifactManifest(artifact.manifest, contract);
      if (
        artifact.artifactManifestDigest !==
          canonicalJsonDigest(artifact.manifest) ||
        artifact.artifactAggregateDigest !==
          artifact.manifest.artifactAggregateDigest
      )
        throw failure("artifactInvalid");
      artifactDigest = artifact.artifactAggregateDigest;
      artifactCheckpoint = {
        artifactManifestDigest: artifact.artifactManifestDigest,
        artifactAggregateDigest: artifact.artifactAggregateDigest,
      };
      await save("verified");
      broker = await this.#invoke(
        generation,
        (context) =>
          ports.broker.copyVerified(request.scope, artifact, context),
        (late) =>
          ports.broker.revoke(
            request.scope,
            late,
            generation,
            new AbortController().signal,
          ),
      );
      await save("brokerCopied");
      try {
        cleanup = await this.#invoke(
          generation,
          (context) =>
            ports.cleanup.cleanupOnce(
              request.operationId,
              request.scope,
              allocation!,
              context,
            ),
          async (late) => {
            assertCleanup(allocation!, late);
            await ports.ledger.retain(
              request.scope,
              reservation!,
              anchor,
              generation,
              new AbortController().signal,
            );
          },
        );
      } catch (error) {
        if (closedReason(error) === "executionTimedOut")
          cleanupBoundaryTimedOut = true;
        throw error;
      }
      assertCleanup(allocation, cleanup);
      await save("cleaned");
      if (cleanup.certain)
        try {
          anchor = await this.#invoke(
            generation,
            (context) =>
              ports.ledger.settle(
                request.scope,
                reservation!,
                allocation!,
                cleanup!,
                anchor,
                context,
              ),
            (late) => {
              anchor = late;
              return Promise.resolve();
            },
          );
        } catch (error) {
          if (closedReason(error) === "executionTimedOut")
            settleBoundaryTimedOut = true;
          throw error;
        }
      else
        anchor = await this.#invoke(() =>
          ports.ledger.retain(
            request.scope,
            reservation!,
            anchor,
            generation,
            signal,
          ),
        );
      await save("ledgerSettled");
      if (!cleanup.certain) {
        await ports.broker.revoke(request.scope, broker, generation, signal);
        return this.#terminal(
          operation,
          result("quarantined", "cleanupUncertain", anchor, null),
          operation.checkpoint!,
        );
      }
      const egress = (await ports.capabilities.issue(
        {
          operationId: request.operationId,
          generation,
          capability: {
            schemaVersion: "artifact-egress-capability-v1",
            jobId: request.scope.jobId,
            tenantId: request.scope.tenantId,
            projectId: request.scope.projectId,
            target: request.scope.target,
            routeRequirementDigest: request.scope.routeRequirementDigest,
            artifactManifestDigest: artifact.artifactManifestDigest,
            artifactAggregateDigest: artifact.artifactAggregateDigest,
            privateBrokerObjectDigest: broker.privateBrokerObjectDigest,
            cleanupEvidenceDigest: cleanup.cleanupEvidenceDigest,
            phase: "artifact_egress",
          },
        },
        signal,
      )) as Extract<ExactCapabilityV1, { phase: "artifact_egress" }>;
      egressCheckpoint = {
        capabilityId: egress.capabilityId,
        capabilityDigest: egress.capabilityDigest,
        released: false,
      };
      terminalIntent = {
        state: "released",
        reason: null,
        artifactAggregateDigest: artifactDigest,
      };
      await save("egressAuthorized");
      const egressEffect = await this.#invoke(
        generation,
        async (context) => {
          const value = await ports.broker.release(request.scope, broker!, {
            capability: egress,
            ...context,
          });
          return { generation: value.generation, value };
        },
        async () => {
          await ports.broker.revoke(
            request.scope,
            broker!,
            generation,
            new AbortController().signal,
          );
        },
      );
      validateConsumption(
        await ports.capabilities.consume(
          egress,
          egressEffect,
          request.operationId,
          generation,
          signal,
        ),
        egress,
        generation,
      );
      egressCheckpoint = { ...egressCheckpoint, released: true };
      await save("artifactReleased");
      anchor = await this.#invoke(
        generation,
        (context) =>
          ports.ledger.release(request.scope, reservation!, anchor, context),
        (late) =>
          this.#convergeLedgerReleased(request.operationId, late).then(
            () => undefined,
          ),
      );
      operation = await this.#convergeLedgerReleased(
        request.operationId,
        anchor,
      );
      terminalizing = true;
      return this.#terminal(
        operation,
        result("released", null, anchor, artifactDigest),
        operation.checkpoint!,
      );
    } catch (error) {
      if (terminalizing || terminalIntent) throw error;
      let reason = closedReason(error);
      if (allocation) {
        if (cleanupBoundaryTimedOut || settleBoundaryTimedOut) {
          reason = cleanupBoundaryTimedOut
            ? "cleanupUncertain"
            : "executionTimedOut";
          if (reservation)
            try {
              anchor = await ports.ledger.retain(
                request.scope,
                reservation,
                anchor,
                generation,
                signal,
              );
            } catch {
              reason = "budgetUnavailable";
            }
        } else
          try {
            cleanup = await this.#invoke(generation, (context) =>
              ports.cleanup.cleanupOnce(
                request.operationId,
                request.scope,
                allocation!,
                context,
              ),
            );
            assertCleanup(allocation, cleanup);
            anchor =
              cleanup.certain && reservation
                ? await this.#invoke(generation, (context) =>
                    ports.ledger.settle(
                      request.scope,
                      reservation!,
                      allocation!,
                      cleanup!,
                      anchor,
                      context,
                    ),
                  )
                : reservation
                  ? await ports.ledger.retain(
                      request.scope,
                      reservation,
                      anchor,
                      generation,
                      signal,
                    )
                  : anchor;
          } catch {
            reason = "cleanupUncertain";
            if (reservation)
              try {
                anchor = await ports.ledger.retain(
                  request.scope,
                  reservation,
                  anchor,
                  generation,
                  signal,
                );
              } catch {}
          }
      } else if (reservation)
        try {
          anchor = await ports.ledger.retain(
            request.scope,
            reservation,
            anchor,
            generation,
            signal,
          );
        } catch {
          reason = "budgetUnavailable";
        }
      if (broker)
        try {
          await ports.broker.revoke(request.scope, broker, generation, signal);
        } catch {
          reason = "cleanupUncertain";
        }
      const context = {
        ...operation.checkpoint!,
        scope: request.scope,
        generation,
        phase: operation.checkpoint!.phase,
        reservation: reservation ?? null,
        allocation: allocation ?? null,
        anchor,
        cleanup: cleanup ?? null,
      };
      return this.#terminal(
        operation,
        result(allocation ? "quarantined" : "failed", reason, anchor, null),
        context,
      );
    }
  }
  async #checkpoint(
    operation: CompilationOperationV1,
    checkpoint: CompilationOperationContextV1,
  ): Promise<CompilationOperationV1> {
    const next = {
      ...operation,
      checkpointDigest: canonicalJsonDigest(checkpoint),
      checkpoint,
      revision: operation.revision + 1,
    };
    if (
      !(await this.ports!.operations.complete(
        operation.operationId,
        operation.revision,
        next,
      ))
    )
      throw failure("budgetUnavailable");
    return next;
  }
  async #terminal(
    operation: CompilationOperationV1,
    publicResult: CompilationCoordinatorResultV1,
    context: CompilationOperationContextV1,
  ): Promise<CompilationCoordinatorResultV1> {
    let current = operation;
    for (let attempt = 0; attempt < 3; attempt++) {
      const stored = { publicResult, context },
        next: CompilationOperationV1 = {
          ...current,
          state: publicResult.state,
          resultDigest: canonicalJsonDigest(stored),
          result: stored,
          checkpointDigest: canonicalJsonDigest(context),
          checkpoint: context,
          revision: current.revision + 1,
        };
      if (
        await this.ports!.operations.complete(
          current.operationId,
          current.revision,
          next,
        )
      )
        return publicResult;
      const loaded = await this.ports!.operations.load(current.operationId);
      if (!loaded) continue;
      validateStoredOperation(loaded);
      if (loaded.state !== "running") return storedResult(loaded).publicResult;
      current = loaded;
    }
    throw failure("budgetUnavailable");
  }
  async #convergeLedgerReleased(
    operationId: string,
    anchor: LedgerAnchorV1,
  ): Promise<CompilationOperationV1> {
    for (let attempt = 0; attempt < 4; attempt++) {
      const current = await this.ports!.operations.load(operationId);
      if (!current) throw failure("budgetUnavailable");
      validateStoredOperation(current);
      if (current.state !== "running") return current;
      if (current.checkpoint!.phase === "ledgerReleased") return current;
      if (
        current.checkpoint!.phase !== "artifactReleased" ||
        !current.checkpoint!.terminalIntent
      )
        throw failure("cleanupUncertain");
      const checkpoint = {
          ...current.checkpoint!,
          phase: "ledgerReleased" as const,
          anchor,
        },
        next = {
          ...current,
          checkpoint,
          checkpointDigest: canonicalJsonDigest(checkpoint),
          revision: current.revision + 1,
        };
      if (
        await this.ports!.operations.complete(
          operationId,
          current.revision,
          next,
        )
      )
        return next;
    }
    throw failure("budgetUnavailable");
  }
  async #invoke<T>(
    generation: number,
    factory: (context: {
      generation: number;
      signal: AbortSignal;
    }) => Promise<{ generation: number; value: T }>,
    onLate?: (value: T) => Promise<void>,
  ): Promise<T>;
  async #invoke<T>(
    factory: () => Promise<T>,
    onLate?: (value: T) => Promise<void>,
  ): Promise<T>;
  async #invoke<T>(
    generationOrFactory: number | (() => Promise<T>),
    factoryOrLate?:
      | ((context: {
          generation: number;
          signal: AbortSignal;
        }) => Promise<{ generation: number; value: T }>)
      | ((value: T) => Promise<void>),
    late?: (value: T) => Promise<void>,
  ): Promise<T> {
    if (typeof generationOrFactory !== "number")
      return withTimeout(
        generationOrFactory(),
        this.boundaryTimeoutMs,
        undefined,
        undefined,
        factoryOrLate as ((value: T) => Promise<void>) | undefined,
      );
    const generation = generationOrFactory,
      controller = new AbortController(),
      factory = factoryOrLate as (context: {
        generation: number;
        signal: AbortSignal;
      }) => Promise<{ generation: number; value: T }>;
    return withTimeout(
      factory({ generation, signal: controller.signal }),
      this.boundaryTimeoutMs,
      controller,
      (effect) => {
        if (effect.generation !== generation) throw failure("routeStale");
        return effect.value;
      },
      late,
    );
  }
  async reconcileCleanup(value: unknown): Promise<LedgerAnchorV1> {
    const input = validateReconcile(value);
    if (!this.ports) throw failure("cleanupUncertain");
    const operation = await this.ports.operations.load(input.operationId);
    if (!operation) {
      throw failure("cleanupUncertain");
    }
    validateStoredOperation(operation);
    if (
      operation.state !== "quarantined" ||
      operation.revision !== input.expectedOperationRevision
    )
      throw failure("cleanupUncertain");
    const stored = storedResult(operation),
      context = stored.context;
    if (
      !context.reservation ||
      !context.allocation ||
      context.allocation.resourceIdDigest !== input.providerResourceIdDigest
    )
      throw failure("cleanupUncertain");
    const cleanup = {
        cleanupEvidenceDigest: input.cleanupEvidenceDigest,
        resourceIdDigest: input.providerResourceIdDigest,
        observedAt: input.observedAt,
        certain: true,
      },
      signal = new AbortController().signal,
      anchor = await this.ports.ledger.reconcileCleanup(
        operation.operationId,
        context.scope,
        context.reservation,
        context.allocation,
        cleanup,
        context.anchor,
        context.generation + 1,
        signal,
      ),
      nextContext = {
        ...context,
        generation: context.generation + 1,
        anchor,
        cleanup,
      };
    await this.#terminal(
      operation,
      {
        ...stored.publicResult,
        ledgerDigest: anchor.ledgerDigest,
        ledgerRevision: anchor.revision,
      },
      nextContext,
    );
    return anchor;
  }
}

function validateConsumption(
  value: CapabilityConsumptionReceiptV1,
  capability: ExactCapabilityV1,
  generation: number,
): void {
  const keys = [
      "schemaVersion",
      "capabilityId",
      "capabilityDigest",
      "phase",
      "generation",
      "consumedAt",
      "receiptDigest",
    ],
    consumed = Date.parse(value?.consumedAt);
  if (
    !value ||
    Object.keys(value).join(",") !== keys.join(",") ||
    value.schemaVersion !== "capability-consumption-receipt-v1" ||
    value.capabilityId !== capability.capabilityId ||
    value.capabilityDigest !== capability.capabilityDigest ||
    value.phase !== capability.phase ||
    value.generation !== generation ||
    !timestamp(value.consumedAt) ||
    consumed < Date.parse(capability.issuedAt) ||
    consumed > Date.parse(capability.expiresAt) ||
    Date.parse(capability.expiresAt) - Date.parse(capability.issuedAt) >
      300000 ||
    value.receiptDigest !==
      canonicalJsonDigest(
        Object.fromEntries(
          Object.entries(value).filter(([k]) => k !== "receiptDigest"),
        ),
      )
  )
    throw failure("routeStale");
}
function validateVerification(
  value: VerificationConsumptionReceiptV1,
  leaseId: string,
  leaseDigest: string,
  generation: number,
): void {
  const keys = [
    "schemaVersion",
    "leaseId",
    "leaseDigest",
    "phase",
    "generation",
    "consumedAt",
    "receiptDigest",
  ];
  if (
    !value ||
    Object.keys(value).join(",") !== keys.join(",") ||
    value.schemaVersion !== "verification-consumption-receipt-v1" ||
    value.leaseId !== leaseId ||
    value.leaseDigest !== leaseDigest ||
    value.phase !== "artifact_verification" ||
    value.generation !== generation ||
    !timestamp(value.consumedAt) ||
    value.receiptDigest !==
      canonicalJsonDigest(
        Object.fromEntries(
          Object.entries(value).filter(([k]) => k !== "receiptDigest"),
        ),
      )
  )
    throw failure("artifactUnproved");
}
function validateStoredOperation(value: CompilationOperationV1): void {
  const keys = [
    "operationId",
    "requestDigest",
    "state",
    "resultDigest",
    "result",
    "checkpointDigest",
    "checkpoint",
    "revision",
  ];
  if (
    Object.keys(value).join(",") !== keys.join(",") ||
    !(["running", "released", "quarantined", "failed"] as unknown[]).includes(
      value.state,
    ) ||
    !opaque.test(value.operationId) ||
    !digest.test(value.requestDigest) ||
    !Number.isSafeInteger(value.revision) ||
    value.revision < 0 ||
    !value.checkpoint ||
    value.checkpointDigest !== canonicalJsonDigest(value.checkpoint)
  )
    throw failure("providerUnavailable");
  validateContext(value.checkpoint, value.state);
  validatePhaseFields(value.checkpoint, value.state);
  if (value.state === "running") {
    if (value.result !== null || value.resultDigest !== null)
      throw failure("providerUnavailable");
  } else if (
    !digest.test(String(value.resultDigest)) ||
    value.resultDigest !== canonicalJsonDigest(value.result)
  )
    throw failure("providerUnavailable");
}
function validateContext(
  value: CompilationOperationContextV1,
  state: CompilationOperationV1["state"],
): void {
  const keys =
    "scope,generation,phase,reservation,allocation,anchor,cleanup,artifact,artifactDigest,broker,brokerDigest,egress,egressDigest,terminalIntent,terminalIntentDigest";
  if (
    Object.keys(value).join(",") !== keys ||
    !Number.isSafeInteger(value.generation) ||
    value.generation < 1
  )
    throw failure("providerUnavailable");
  assertExact(
    value.scope,
    "jobId,tenantId,projectId,target,routeRequirementDigest",
  );
  assertExact(value.anchor, "ledgerDigest,revision");
  if (
    !digest.test(value.anchor.ledgerDigest) ||
    !Number.isSafeInteger(value.anchor.revision) ||
    value.anchor.revision < 0
  )
    throw failure("providerUnavailable");
  if (value.reservation) {
    assertExact(value.reservation, "reservationId,ledgerDigest,revision");
    if (
      !opaque.test(value.reservation.reservationId) ||
      !digest.test(value.reservation.ledgerDigest) ||
      !Number.isSafeInteger(value.reservation.revision) ||
      value.reservation.revision < 0
    )
      throw failure("providerUnavailable");
  }
  if (value.allocation) {
    assertExact(value.allocation, "resourceIdDigest,workerEvidenceDigest");
    if (
      !digest.test(value.allocation.resourceIdDigest) ||
      !digest.test(value.allocation.workerEvidenceDigest)
    )
      throw failure("providerUnavailable");
  }
  if (value.cleanup) {
    assertExact(
      value.cleanup,
      "cleanupEvidenceDigest,resourceIdDigest,observedAt,certain",
    );
    if (
      !digest.test(value.cleanup.cleanupEvidenceDigest) ||
      value.cleanup.resourceIdDigest !== value.allocation?.resourceIdDigest ||
      !timestamp(value.cleanup.observedAt) ||
      typeof value.cleanup.certain !== "boolean"
    )
      throw failure("providerUnavailable");
  }
  for (const [item, itemDigest] of [
    [value.artifact, value.artifactDigest],
    [value.broker, value.brokerDigest],
    [value.egress, value.egressDigest],
    [value.terminalIntent, value.terminalIntentDigest],
  ] as const) {
    if (
      (item === null) !== (itemDigest === null) ||
      (item !== null && itemDigest !== canonicalJsonDigest(item))
    )
      throw failure("providerUnavailable");
  }
  if (value.artifact) {
    assertExact(
      value.artifact,
      "artifactManifestDigest,artifactAggregateDigest",
    );
    if (
      !digest.test(value.artifact.artifactManifestDigest) ||
      !digest.test(value.artifact.artifactAggregateDigest)
    )
      throw failure("providerUnavailable");
  }
  if (value.broker) {
    assertExact(value.broker, "privateBrokerObjectDigest");
    if (!digest.test(value.broker.privateBrokerObjectDigest))
      throw failure("providerUnavailable");
  }
  if (value.egress) {
    assertExact(value.egress, "capabilityId,capabilityDigest,released");
    if (
      !opaque.test(value.egress.capabilityId) ||
      !digest.test(value.egress.capabilityDigest) ||
      typeof value.egress.released !== "boolean"
    )
      throw failure("providerUnavailable");
  }
  if (value.terminalIntent) {
    assertExact(value.terminalIntent, "state,reason,artifactAggregateDigest");
    if (
      value.terminalIntent.state !== "released" ||
      value.terminalIntent.reason !== null ||
      value.terminalIntent.artifactAggregateDigest !==
        value.artifact?.artifactAggregateDigest
    )
      throw failure("providerUnavailable");
  }
  const order: CompilationPhaseV1[] = [
      "created",
      "reserved",
      "allocated",
      "observed",
      "sealed",
      "ingressed",
      "executed",
      "verified",
      "brokerCopied",
      "cleaned",
      "ledgerSettled",
      "egressAuthorized",
      "artifactReleased",
      "ledgerReleased",
    ],
    rank = order.indexOf(value.phase);
  if (
    rank < 0 ||
    (value.allocation && !value.reservation) ||
    (value.cleanup && !value.allocation) ||
    (value.artifact && !value.allocation) ||
    (value.broker && !value.artifact) ||
    (value.egress && (!value.broker || !value.cleanup)) ||
    (value.terminalIntent && !value.egress)
  )
    throw failure("providerUnavailable");
  if (
    (value.reservation !== null) !== rank >= 1 ||
    (value.allocation !== null) !== rank >= 2 ||
    (value.artifact !== null) !== rank >= 7 ||
    (value.broker !== null) !== rank >= 8 ||
    (state === "running"
      ? (value.cleanup !== null) !== rank >= 9
      : rank >= 9 && value.cleanup === null) ||
    (value.egress !== null) !== rank >= 11 ||
    (value.terminalIntent !== null) !== rank >= 11 ||
    (value.egress !== null && value.egress.released !== rank >= 12) ||
    (state === "released" && value.phase !== "ledgerReleased")
  )
    throw failure("providerUnavailable");
}
function storedResult(operation: CompilationOperationV1): StoredTerminalV1 {
  validateStoredOperation(operation);
  const value = operation.result;
  if (
    !value ||
    typeof value !== "object" ||
    Object.keys(value).join(",") !== "publicResult,context"
  )
    throw failure("providerUnavailable");
  const stored = value as StoredTerminalV1;
  assertExact(
    stored.publicResult,
    "state,reason,ledgerDigest,ledgerRevision,artifactAggregateDigest",
  );
  validateContext(stored.context, operation.state);
  if (
    (stored.context !== operation.checkpoint &&
      canonicalJsonDigest(stored.context) !== operation.checkpointDigest) ||
    stored.publicResult.state !== operation.state ||
    !digest.test(stored.publicResult.ledgerDigest) ||
    !Number.isSafeInteger(stored.publicResult.ledgerRevision) ||
    stored.publicResult.ledgerRevision < 0 ||
    stored.publicResult.ledgerDigest !== stored.context.anchor.ledgerDigest ||
    stored.publicResult.ledgerRevision !== stored.context.anchor.revision ||
    (stored.publicResult.state === "released" &&
      (stored.publicResult.reason !== null ||
        !digest.test(String(stored.publicResult.artifactAggregateDigest)) ||
        stored.publicResult.artifactAggregateDigest !==
          stored.context.artifact?.artifactAggregateDigest)) ||
    (stored.publicResult.state !== "released" &&
      (!COMPILATION_CLOSED_REASONS.includes(
        stored.publicResult.reason as CompilationClosedReason,
      ) ||
        stored.publicResult.artifactAggregateDigest !== null))
  )
    throw failure("providerUnavailable");
  return stored;
}
function validatePhaseFields(
  value: CompilationOperationContextV1,
  state: CompilationOperationV1["state"],
): void {
  if (state === "released" && value.phase !== "ledgerReleased")
    throw failure("providerUnavailable");
}
function assertExact(value: object, keys: string): void {
  if (Object.keys(value).join(",") !== keys)
    throw failure("providerUnavailable");
  if (keys === "jobId,tenantId,projectId,target,routeRequirementDigest") {
    const scope = value as CompilationScopeV1;
    if (
      !opaque.test(scope.jobId) ||
      !opaque.test(scope.tenantId) ||
      !opaque.test(scope.projectId) ||
      !(scope.target === "astro_web" || scope.target === "flutter_web") ||
      !digest.test(scope.routeRequirementDigest)
    )
      throw failure("providerUnavailable");
  }
}
function validateRequest(value: unknown): CompilationCoordinatorRequestV1 {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw failure("routeStale");
  const v = value as Record<string, unknown>,
    keys = [
      "schemaVersion",
      "operationId",
      "scope",
      "expectedLedgerDigest",
      "expectedLedgerRevision",
      "budgetDigest",
      "planId",
      "leaseId",
      "now",
    ];
  if (
    Object.keys(v).join(",") !== keys.join(",") ||
    v["schemaVersion"] !== "compilation-coordinator-request-v1" ||
    !opaque.test(String(v["operationId"])) ||
    !digest.test(String(v["expectedLedgerDigest"])) ||
    !Number.isSafeInteger(v["expectedLedgerRevision"]) ||
    Number(v["expectedLedgerRevision"]) < 0 ||
    !digest.test(String(v["budgetDigest"])) ||
    !opaque.test(String(v["planId"])) ||
    !opaque.test(String(v["leaseId"])) ||
    !(v["now"] instanceof Date) ||
    !Number.isFinite(v["now"].getTime())
  )
    throw failure("routeStale");
  const s = v["scope"] as Record<string, unknown>;
  if (
    !s ||
    Object.keys(s).join(",") !==
      "jobId,tenantId,projectId,target,routeRequirementDigest" ||
    ![s["jobId"], s["tenantId"], s["projectId"]].every((x) =>
      opaque.test(String(x)),
    ) ||
    !(s["target"] === "astro_web" || s["target"] === "flutter_web") ||
    !digest.test(String(s["routeRequirementDigest"]))
  )
    throw failure("routeStale");
  return value as CompilationCoordinatorRequestV1;
}
function validateReconcile(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw failure("cleanupUncertain");
  const v = value as Record<string, unknown>,
    keys = [
      "operationId",
      "providerResourceIdDigest",
      "cleanupEvidenceDigest",
      "observedAt",
      "expectedOperationRevision",
      "now",
    ];
  if (
    Object.keys(v).join(",") !== keys.join(",") ||
    !opaque.test(String(v["operationId"])) ||
    !digest.test(String(v["providerResourceIdDigest"])) ||
    !digest.test(String(v["cleanupEvidenceDigest"])) ||
    !timestamp(v["observedAt"]) ||
    !Number.isSafeInteger(v["expectedOperationRevision"]) ||
    !(v["now"] instanceof Date) ||
    !Number.isFinite(v["now"].getTime())
  )
    throw failure("cleanupUncertain");
  return v as {
    operationId: string;
    providerResourceIdDigest: string;
    cleanupEvidenceDigest: string;
    observedAt: string;
    expectedOperationRevision: number;
    now: Date;
  };
}
function assertManifestScope(
  scope: CompilationScopeV1,
  value: { jobId: string; tenantId: string; projectId: string; target: string },
) {
  if (
    value.jobId !== scope.jobId ||
    value.tenantId !== scope.tenantId ||
    value.projectId !== scope.projectId ||
    value.target !== scope.target
  )
    throw failure("sourceInvalid");
}
function assertArtifactScope(
  scope: CompilationScopeV1,
  sourceDigest: string,
  value: {
    jobId: string;
    tenantId: string;
    projectId: string;
    target: string;
    sourceAggregateDigest: string;
  },
) {
  if (
    value.jobId !== scope.jobId ||
    value.tenantId !== scope.tenantId ||
    value.projectId !== scope.projectId ||
    value.target !== scope.target ||
    value.sourceAggregateDigest !== sourceDigest
  )
    throw failure("artifactInvalid");
}
function assertCleanup(
  allocation: WorkerAllocationV1,
  value: CleanupEvidenceV1,
) {
  if (
    value.resourceIdDigest !== allocation.resourceIdDigest ||
    !digest.test(value.cleanupEvidenceDigest) ||
    !timestamp(value.observedAt)
  )
    throw failure("cleanupUncertain");
}
function assertDefinitelyNoCreate(
  value: {
    kind: string;
    operationId: string;
    generation: number;
    reservationId: string;
    evidenceDigest: string;
  },
  operationId: string,
  generation: number,
  reservationId: string,
): void {
  if (
    Object.keys(value).join(",") !==
      "kind,operationId,generation,reservationId,evidenceDigest" ||
    value.kind !== "definitelyNoCreate" ||
    value.operationId !== operationId ||
    value.generation !== generation ||
    value.reservationId !== reservationId ||
    !digest.test(value.evidenceDigest)
  )
    throw failure("cleanupUncertain");
}
function validateReleaseReconciliation(
  value: ReleaseReconciliationReceiptV1,
  operationId: string,
  reservationId: string,
  generation: number,
  expected: LedgerAnchorV1,
): LedgerAnchorV1 {
  const keys =
    "schemaVersion,operationId,reservationId,state,generation,previousLedgerDigest,previousRevision,currentLedgerDigest,currentRevision,evidenceDigest,observedAt,receiptDigest";
  if (
    Object.keys(value).join(",") !== keys ||
    value.schemaVersion !== "release-reconciliation-receipt-v1" ||
    value.operationId !== operationId ||
    value.reservationId !== reservationId ||
    value.state !== "released" ||
    value.generation !== generation ||
    value.previousLedgerDigest !== expected.ledgerDigest ||
    value.previousRevision !== expected.revision ||
    !digest.test(value.currentLedgerDigest) ||
    value.currentLedgerDigest === value.previousLedgerDigest ||
    !Number.isSafeInteger(value.currentRevision) ||
    value.currentRevision <= value.previousRevision ||
    !digest.test(value.evidenceDigest) ||
    value.evidenceDigest === value.currentLedgerDigest ||
    !timestamp(value.observedAt) ||
    value.receiptDigest !==
      canonicalJsonDigest(
        Object.fromEntries(
          Object.entries(value).filter(([key]) => key !== "receiptDigest"),
        ),
      )
  )
    throw failure("cleanupUncertain");
  return {
    ledgerDigest: value.currentLedgerDigest,
    revision: value.currentRevision,
  };
}
function assertDigest(value: string, reason: CompilationClosedReason) {
  if (!digest.test(value)) throw failure(reason);
}
function anchorFrom(value: AnchoredLedgerReservationV1): LedgerAnchorV1 {
  return { ledgerDigest: value.ledgerDigest, revision: value.revision };
}
function plus(value: Date, ms: number) {
  return new Date(value.getTime() + ms).toISOString();
}
function timestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}
function result(
  state: CompilationCoordinatorResultV1["state"],
  reason: CompilationClosedReason | null,
  anchor: LedgerAnchorV1,
  artifactAggregateDigest: string | null,
): CompilationCoordinatorResultV1 {
  return {
    state,
    reason,
    ledgerDigest: anchor.ledgerDigest,
    ledgerRevision: anchor.revision,
    artifactAggregateDigest,
  };
}
function failed(
  reason: CompilationClosedReason,
  r: CompilationCoordinatorRequestV1,
) {
  return result(
    "failed",
    reason,
    {
      ledgerDigest: r.expectedLedgerDigest,
      revision: r.expectedLedgerRevision,
    },
    null,
  );
}
function failure(
  reason: CompilationClosedReason,
): Error & { reason: CompilationClosedReason } {
  return Object.assign(new Error(reason), { reason });
}
function closedReason(error: unknown): CompilationClosedReason {
  if (
    error &&
    typeof error === "object" &&
    "reason" in error &&
    COMPILATION_CLOSED_REASONS.includes(
      (error as { reason: CompilationClosedReason }).reason,
    )
  )
    return (error as { reason: CompilationClosedReason }).reason;
  return "providerUnavailable";
}
export function coordinatorRequestDigest(
  value: CompilationCoordinatorRequestV1,
): string {
  return canonicalJsonDigest({
    schemaVersion: value.schemaVersion,
    operationId: value.operationId,
    scope: value.scope,
    expectedLedgerDigest: value.expectedLedgerDigest,
    expectedLedgerRevision: value.expectedLedgerRevision,
    budgetDigest: value.budgetDigest,
    planId: value.planId,
    leaseId: value.leaseId,
    now: value.now.toISOString(),
  });
}
async function withTimeout<T, R = T>(
  promise: Promise<T>,
  ms: number,
  controller?: AbortController,
  map?: (value: T) => R | Promise<R>,
  onLate?: (value: R) => Promise<void>,
): Promise<R> {
  let expired = false,
    timer: ReturnType<typeof setTimeout> | undefined;
  const guarded = promise.then(
    async (raw) => {
      const value = map ? await map(raw) : (raw as unknown as R);
      if (expired) {
        await onLate?.(value);
        throw failure("executionTimedOut");
      }
      return value;
    },
    (error) => {
      if (expired) throw failure("executionTimedOut");
      throw error;
    },
  );
  try {
    return await Promise.race([
      guarded,
      new Promise<R>((_, reject) => {
        timer = setTimeout(() => {
          expired = true;
          controller?.abort();
          reject(failure("executionTimedOut"));
        }, ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
