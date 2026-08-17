export function formatDepartureMonths(
  months: number[],
  monthLabel: (m: number) => string,
  joinWord: string,   // "à" / "to" / "bis" / "a"
  separator = ', '
): string {
  if (!months || months.length === 0) return '';
  const sorted = Array.from(new Set(months)).sort((a, b) => a - b);
  if (sorted.length === 12) return ''; // toute l'année -> pas de badge

  const ranges: [number, number][] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prev + 1) {
      prev = sorted[i];
    } else {
      ranges.push([start, prev]);
      start = sorted[i];
      prev = sorted[i];
    }
  }
  ranges.push([start, prev]);

  // Fusion cyclique déc -> janv si plusieurs plages
  if (ranges.length > 1) {
    const first = ranges[0];
    const last = ranges[ranges.length - 1];
    if (first[0] === 1 && last[1] === 12) {
      ranges[0] = [last[0], first[1]];
      ranges.pop();
    }
  }

  return ranges
    .map(([from, to]) =>
      from === to ? monthLabel(from) : `${monthLabel(from)} ${joinWord} ${monthLabel(to)}`
    )
    .join(separator);
}