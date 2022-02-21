export function convertToInternationalCurrencySystem(value: number) {
  if (Math.abs(value) >= 1.0e9) {
    return `$${(Math.abs(value) / 1.0e9).toFixed(2)}b`;
  }

  if (Math.abs(value) >= 1.0e6) {
    return `$${(Math.abs(value) / 1.0e6).toFixed(2)}m`;
  }
  if (Math.abs(value) >= 1.0e3) {
    return `$${(Math.abs(value) / 1.0e3).toFixed(2)}k`;
  }

  return `$${Math.abs(value).toFixed(2)}`;
}
