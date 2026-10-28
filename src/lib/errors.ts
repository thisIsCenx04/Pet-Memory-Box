export class NotFoundError extends Error {
  constructor(message = "Không tìm thấy") {
    super(message);
    this.name = "NotFoundError";
  }
}

/** Xung đột trạng thái hoặc phiên bản (HTTP 409). */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export function isUniqueViolation(e: unknown, field?: string): boolean {
  if (typeof e !== "object" || e === null || (e as { code?: string }).code !== "P2002") return false;
  if (!field) return true;
  return JSON.stringify((e as { meta?: unknown }).meta ?? {}).includes(field);
}
