export function getRandomId(): string {
  return (Math.random() * 10_000).toString(36).substring(12);
}
