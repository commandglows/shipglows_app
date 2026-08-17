import type { CompilationArtifactManifestV1 } from "./artifactPolicy.js";
import { canonicalJsonDigest } from "./canonicalManifest.js";
import type {
  AdmissionCapabilityV1,
  ArtifactEgressCapabilityV1,
  ArtifactVerificationLeaseV1,
  CompilationClosedReason,
  CompilationPlanNameV1,
  ExecutionCapabilityV1,
  SourceIngressCapabilityV1,
  ExactCapabilityV1,
} from "./contracts.js";
import { ExactCapabilityStore } from "./contracts.js";
import type { CompilationSourceManifestV1 } from "./sourcePolicy.js";

export interface CompilationScopeV1 { readonly jobId:string; readonly tenantId:string; readonly projectId:string; readonly target:"astro_web"|"flutter_web"; readonly routeRequirementDigest:string; }
export interface LedgerAnchorV1 { readonly ledgerDigest:string; readonly revision:number; }
export interface AnchoredLedgerReservationV1 extends LedgerAnchorV1 { readonly reservationId:string; }
export interface WorkerAllocationV1 { readonly resourceIdDigest:string; readonly workerEvidenceDigest:string; }
export interface BoundaryContextV1 { readonly signal:AbortSignal; readonly generation:number; }
export interface BoundaryEffectV1<T> { readonly generation:number; readonly value:T; }
export interface PhaseInvocationV1<C> { readonly capability:C; readonly generation:number; readonly signal:AbortSignal; }
export interface CapabilityConsumptionReceiptV1 { readonly schemaVersion:"capability-consumption-receipt-v1"; readonly capabilityId:string; readonly capabilityDigest:string; readonly phase:"admission"|"source_ingress"|"execution"|"artifact_egress"; readonly generation:number; readonly consumedAt:string; readonly receiptDigest:string; }
export interface PhaseEffectEvidenceV1 { readonly schemaVersion:"phase-effect-evidence-v1"; readonly operationId:string; readonly phase:"admission"|"source_ingress"|"execution"|"artifact_egress"; readonly generation:number; readonly evidenceDigest:string; readonly observedAt:string; }
export interface AdmissionAcquiredV1 extends WorkerAllocationV1 { readonly kind:"acquired"; readonly effect:PhaseEffectEvidenceV1; }
export type AdmissionAcquireFailureKindV1="definitelyNoCreate"|"ambiguous"|"created"|"other";
export interface AdmissionAcquireFailureV1 { readonly kind:AdmissionAcquireFailureKindV1; readonly operationId:string; readonly generation:number; readonly reservationId:string; readonly evidenceDigest:string; }
export type AdmissionAcquireOutcomeV1=AdmissionAcquiredV1|AdmissionAcquireFailureV1;
export interface VerificationConsumptionReceiptV1 { readonly schemaVersion:"verification-consumption-receipt-v1"; readonly leaseId:string; readonly leaseDigest:string; readonly phase:"artifact_verification"; readonly generation:number; readonly consumedAt:string; readonly receiptDigest:string; }
export interface SandboxExecutionRequestV1 { readonly scope:CompilationScopeV1; readonly allocation:WorkerAllocationV1; readonly plan:CompilationPlanNameV1; readonly planDigest:string; readonly sourceAggregateDigest:string; readonly artifactContractDigest:string; readonly timeoutMs:600000; }
export interface SandboxExecutionResultV1 { readonly stdoutDigest:string; readonly stderrDigest:string; readonly effect:PhaseEffectEvidenceV1; }
export interface VerifiedArtifactV1 { readonly manifest:CompilationArtifactManifestV1; readonly artifactManifestDigest:string; readonly artifactAggregateDigest:string; readonly consumption:VerificationConsumptionReceiptV1; }
export interface BrokerQuarantineV1 { readonly privateBrokerObjectDigest:string; }
export interface CleanupEvidenceV1 { readonly cleanupEvidenceDigest:string; readonly resourceIdDigest:string; readonly observedAt:string; readonly certain:boolean; }
export type CompilationOperationStateV1="running"|"released"|"quarantined"|"failed";
export type CompilationPhaseV1="created"|"reserved"|"allocated"|"observed"|"sealed"|"ingressed"|"executed"|"verified"|"brokerCopied"|"cleaned"|"egressAuthorized"|"artifactReleased"|"ledgerSettled"|"ledgerReleased";
export interface ArtifactCheckpointV1 { readonly artifactManifestDigest:string; readonly artifactAggregateDigest:string; }
export interface EgressCheckpointV1 { readonly capabilityId:string; readonly capabilityDigest:string; readonly released:boolean; }
export interface TerminalIntentV1 { readonly state:"released"|"quarantined"|"failed"; readonly reason:CompilationClosedReason|null; readonly artifactAggregateDigest:string|null; }
export interface ReleaseReconciliationReceiptV1 { readonly schemaVersion:"release-reconciliation-receipt-v1"; readonly operationId:string; readonly reservationId:string; readonly state:"released"; readonly generation:number; readonly previousLedgerDigest:string; readonly previousRevision:number; readonly currentLedgerDigest:string; readonly currentRevision:number; readonly evidenceDigest:string; readonly observedAt:string; readonly receiptDigest:string; }
export interface CompilationOperationContextV1 { readonly scope:CompilationScopeV1; readonly generation:number; readonly phase:CompilationPhaseV1; readonly reservation:AnchoredLedgerReservationV1|null; readonly allocation:WorkerAllocationV1|null; readonly anchor:LedgerAnchorV1; readonly cleanup:CleanupEvidenceV1|null; readonly artifact:ArtifactCheckpointV1|null; readonly artifactDigest:string|null; readonly broker:BrokerQuarantineV1|null; readonly brokerDigest:string|null; readonly egress:EgressCheckpointV1|null; readonly egressDigest:string|null; readonly terminalIntent:TerminalIntentV1|null; readonly terminalIntentDigest:string|null; }
export interface CompilationOperationV1 { readonly operationId:string; readonly requestDigest:string; readonly state:CompilationOperationStateV1; readonly resultDigest:string|null; readonly result:unknown; readonly checkpointDigest:string|null; readonly checkpoint:CompilationOperationContextV1|null; readonly revision:number; }

export interface CompilationAdmissionPort {
  reserve(scope:CompilationScopeV1,expected:LedgerAnchorV1,context:BoundaryContextV1):Promise<BoundaryEffectV1<AnchoredLedgerReservationV1>>;
  acquire(scope:CompilationScopeV1,reservation:AnchoredLedgerReservationV1,invocation:PhaseInvocationV1<AdmissionCapabilityV1>):Promise<AdmissionAcquireOutcomeV1>;
}
export interface CompilationSourceIngressPort {
  seal(scope:CompilationScopeV1,context:BoundaryContextV1):Promise<BoundaryEffectV1<CompilationSourceManifestV1>>;
  ingress(scope:CompilationScopeV1,allocation:WorkerAllocationV1,manifest:CompilationSourceManifestV1,invocation:PhaseInvocationV1<SourceIngressCapabilityV1>):Promise<PhaseEffectEvidenceV1>;
}
export interface SandboxCompilationPort { execute(request:SandboxExecutionRequestV1,invocation:PhaseInvocationV1<ExecutionCapabilityV1>):Promise<SandboxExecutionResultV1>; }
export interface ArtifactVerificationPort { verify(scope:CompilationScopeV1,allocation:WorkerAllocationV1,lease:ArtifactVerificationLeaseV1,context:BoundaryContextV1):Promise<BoundaryEffectV1<VerifiedArtifactV1>>; }
export interface PrivateBrokerPort {
  copyVerified(scope:CompilationScopeV1,artifact:VerifiedArtifactV1,context:BoundaryContextV1):Promise<BoundaryEffectV1<BrokerQuarantineV1>>;
  release(scope:CompilationScopeV1,broker:BrokerQuarantineV1,invocation:PhaseInvocationV1<ArtifactEgressCapabilityV1>):Promise<PhaseEffectEvidenceV1>;
  revoke(scope:CompilationScopeV1,broker:BrokerQuarantineV1,generation:number,signal:AbortSignal):Promise<void>;
}
export interface CompilationCleanupPort { cleanupOnce(operationId:string,scope:CompilationScopeV1,allocation:WorkerAllocationV1,context:BoundaryContextV1):Promise<BoundaryEffectV1<CleanupEvidenceV1>>; }
export interface CompilationLedgerPort {
  observeCreate(scope:CompilationScopeV1,reservation:AnchoredLedgerReservationV1,expected:LedgerAnchorV1,context:BoundaryContextV1):Promise<BoundaryEffectV1<LedgerAnchorV1>>;
  settle(scope:CompilationScopeV1,reservation:AnchoredLedgerReservationV1,allocation:WorkerAllocationV1,cleanup:CleanupEvidenceV1,expected:LedgerAnchorV1,context:BoundaryContextV1):Promise<BoundaryEffectV1<LedgerAnchorV1>>;
  release(scope:CompilationScopeV1,reservation:AnchoredLedgerReservationV1,expected:LedgerAnchorV1,context:BoundaryContextV1):Promise<BoundaryEffectV1<LedgerAnchorV1>>;
  retain(scope:CompilationScopeV1,reservation:AnchoredLedgerReservationV1,expected:LedgerAnchorV1,generation:number,signal:AbortSignal):Promise<LedgerAnchorV1>;
  retryBeforeCreate(scope:CompilationScopeV1,reservation:AnchoredLedgerReservationV1,expected:LedgerAnchorV1,context:BoundaryContextV1):Promise<BoundaryEffectV1<AnchoredLedgerReservationV1>>;
  reconcileCleanup(operationId:string,scope:CompilationScopeV1,reservation:AnchoredLedgerReservationV1,allocation:WorkerAllocationV1,cleanup:CleanupEvidenceV1,expected:LedgerAnchorV1,generation:number,signal:AbortSignal):Promise<LedgerAnchorV1>;
  reconcileRelease(operationId:string,scope:CompilationScopeV1,reservation:AnchoredLedgerReservationV1,expected:LedgerAnchorV1,context:BoundaryContextV1):Promise<BoundaryEffectV1<ReleaseReconciliationReceiptV1>>;
}
export interface CompilationOperationStorePort { load(operationId:string):Promise<CompilationOperationV1|null>; create(operation:CompilationOperationV1):Promise<boolean>; complete(operationId:string,expectedRevision:number,operation:CompilationOperationV1):Promise<boolean>; }
export interface PhaseCapabilityAuthorityPort {
  issue(input:{readonly operationId:string;readonly generation:number;readonly capability:IssuableCapabilityV1},signal:AbortSignal):Promise<ExactCapabilityV1>;
  consume(capability:ExactCapabilityV1,effect:PhaseEffectEvidenceV1,operationId:string,generation:number,signal:AbortSignal):Promise<CapabilityConsumptionReceiptV1>;
  revoke(capability:ExactCapabilityV1,operationId:string,generation:number,signal:AbortSignal):Promise<void>;
}
export interface CompilationCoordinatorPorts { readonly admission:CompilationAdmissionPort; readonly source:CompilationSourceIngressPort; readonly sandbox:SandboxCompilationPort; readonly verifier:ArtifactVerificationPort; readonly broker:PrivateBrokerPort; readonly cleanup:CompilationCleanupPort; readonly ledger:CompilationLedgerPort; readonly operations:CompilationOperationStorePort; readonly capabilities:PhaseCapabilityAuthorityPort; }
export interface CompilationFailureV1 { readonly reason:CompilationClosedReason; }
type Issuable<T> = T extends ExactCapabilityV1 ? Omit<T,"capabilityId"|"capabilityDigest"|"issuedAt"|"expiresAt"|"state"> : never;
export type IssuableCapabilityV1=Issuable<ExactCapabilityV1>;

export class InMemoryPhaseCapabilityAuthority implements PhaseCapabilityAuthorityPort {
  readonly #store=new ExactCapabilityStore();readonly #bindings=new Map<string,{operationId:string;generation:number}>();
  constructor(private readonly nonce:()=>string,private readonly clock:()=>Date){}
  async issue(input:{readonly operationId:string;readonly generation:number;readonly capability:IssuableCapabilityV1},signal:AbortSignal):Promise<ExactCapabilityV1>{
    await Promise.resolve();
    if(signal.aborted||!Number.isSafeInteger(input.generation)||input.generation<1)throw new Error("Capability authority rejected issuance.");const capabilityId=this.nonce(),issued=this.clock();if(!/^[a-z0-9_-]{22,128}$/.test(capabilityId)||!Number.isFinite(issued.getTime()))throw new Error("Capability authority rejected issuance.");const times={capabilityId,issuedAt:issued.toISOString(),expiresAt:new Date(issued.getTime()+300000).toISOString()};let grant:ExactCapabilityV1;const c=input.capability;
    switch(c.phase){case"admission":grant=this.#store.issueAdmission({...c,...times});break;case"source_ingress":grant=this.#store.issueSourceIngress({...c,...times});break;case"execution":grant=this.#store.issueExecution({...c,...times});break;case"artifact_egress":grant=this.#store.issueArtifactEgress({...c,...times});break;}
    this.#bindings.set(grant.capabilityId,{operationId:input.operationId,generation:input.generation});return grant;
  }
  async consume(capability:ExactCapabilityV1,effect:PhaseEffectEvidenceV1,operationId:string,generation:number,signal:AbortSignal):Promise<CapabilityConsumptionReceiptV1>{
    await Promise.resolve();const now=this.clock(),binding=this.#bindings.get(capability.capabilityId),keys="schemaVersion,operationId,phase,generation,evidenceDigest,observedAt";if(signal.aborted||Object.keys(effect).join(",")!==keys||(effect as {schemaVersion:string}).schemaVersion!=="phase-effect-evidence-v1"||binding?.operationId!==operationId||binding.generation!==generation||effect.operationId!==operationId||effect.phase!==capability.phase||effect.generation!==generation||!/^[a-f0-9]{64}$/.test(effect.evidenceDigest)||!Number.isFinite(now.getTime())||!Number.isFinite(Date.parse(effect.observedAt))||Date.parse(effect.observedAt)<Date.parse(capability.issuedAt)||Date.parse(effect.observedAt)>now.getTime()||now.getTime()>Date.parse(capability.expiresAt)||Date.parse(capability.expiresAt)-Date.parse(capability.issuedAt)>300000)throw new Error("Capability authority rejected consumption.");
    this.#store.consume(capability.capabilityId,now,{...capability});const core={schemaVersion:"capability-consumption-receipt-v1" as const,capabilityId:capability.capabilityId,capabilityDigest:capability.capabilityDigest,phase:capability.phase,generation,consumedAt:now.toISOString()};return Object.freeze({...core,receiptDigest:canonicalJsonDigest(core)});
  }
  async revoke(capability:ExactCapabilityV1,operationId:string,generation:number,signal:AbortSignal):Promise<void>{await Promise.resolve();const binding=this.#bindings.get(capability.capabilityId);if(signal.aborted||binding?.operationId!==operationId||binding.generation!==generation)throw new Error("Capability authority rejected revocation.");this.#store.revoke(capability.capabilityId);}
}
