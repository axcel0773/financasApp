export type DomainError = { code: string; message: string };
export const domainError = (code: string, message: string): DomainError => ({ code, message });
