export function normalizeReferenceNumber(
  value: string | null | undefined
): string {
  if (!value) return "";

  return value
    .trim()
    .toUpperCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/[^A-Z0-9-]/g, "");
}

export function normalizeInvoiceNumber(
  value: string | null | undefined
): string {
  const normalized = normalizeReferenceNumber(value);

  if (!normalized) return "";

  const compact = normalized.replace(/-/g, "");

  const match = compact.match(/^INV(\d{4})(\d+)$/);

  if (!match) return normalized;

  const [, year, sequence] = match;

  return `INV-${year}-${sequence.padStart(3, "0")}`;
}
