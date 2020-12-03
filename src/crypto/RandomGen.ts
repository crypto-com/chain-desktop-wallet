export function getRandomId(): string {
  let randomSum = 0;
  const randMin = 1_000_000;
  const iterations = 12;
  for (let i = 0; i < iterations; i++) {
    const rand = Math.floor(100 ** Math.random() * randMin ** 2);
    randomSum += rand;
  }
  return randomSum.toString(16).substr(0, 12);
}
