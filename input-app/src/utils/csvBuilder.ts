import type { Template, Question } from '@shared/templates';

function escapeCsv(value: string): string {
  if (/[,\n"]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

export function buildCsv(
  departmentId: string,
  template: Template,
  data: Record<string, string | string[]>
): string {
  const fields = template.questions.map((q: Question) => {
    const val = data[q.id];
    if (Array.isArray(val)) return val.join(';');
    return val ?? '';
  });
  const values = [departmentId, ...fields].map((v) => escapeCsv(String(v)));
  return values.join(',');
}
