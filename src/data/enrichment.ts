export function rankGenes<T extends { log2fc: number }>(genes: T[], order: 'desc' | 'asc') {
  return [...genes].sort((a, b) => (order === 'desc' ? -1 : 1) * (a.log2fc - b.log2fc));
}

export function runningScores<T extends { id: string }>(ranked: T[], members: string[]) {
  const hits = ranked.filter(item => members.includes(item.id)).length;
  if (hits === 0 || hits === ranked.length) throw new Error('セット内・セット外の両方が必要です');
  let sum = 0;
  return [0, ...ranked.map(item => {
    sum += members.includes(item.id) ? 1 / hits : -1 / (ranked.length - hits);
    return Math.abs(sum) < 1e-10 ? 0 : sum;
  })];
}
