export function parseCsv(csv: string): { label: string; value: string }[] {
  const lines = csv.trim().split('\n');
  return lines.map((line, i) => ({
    label: `質問${i + 1}`,
    value: line.trim()
  }));
}
