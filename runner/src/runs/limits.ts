export class RunLimitError extends Error {
  constructor(
    readonly code: "runQuotaExceeded" | "runTimeout",
    message: string,
  ) {
    super(message);
    this.name = "RunLimitError";
  }
}

export class RunAdmission {
  readonly #activeByTenant = new Map<string, number>();

  acquire(tenantId: string, maximum: number): boolean {
    const active = this.#activeByTenant.get(tenantId) ?? 0;
    if (active >= maximum) return false;
    this.#activeByTenant.set(tenantId, active + 1);
    return true;
  }

  release(tenantId: string): void {
    const active = this.#activeByTenant.get(tenantId) ?? 0;
    if (active <= 1) this.#activeByTenant.delete(tenantId);
    else this.#activeByTenant.set(tenantId, active - 1);
  }
}
