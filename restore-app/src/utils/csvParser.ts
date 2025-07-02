import type { Template, Question } from '../../shared/templates';

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else if (char !== '\r' && char !== '\n') {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}

export function parseCsvValues(csv: string): string[] {
  return splitCsvLine(csv.trim());
}

export function mapValuesToLabels(
  values: string[],
  template: Template,
  filterConditional = false
): { label: string; value: string }[] {
  const answers: Record<string, string | string[]> = {};
  const result: { label: string; value: string }[] = [];

  template.questions.forEach((q: Question, idx: number) => {
    const raw = values[idx] ?? '';
    let display = raw;
    let store: string | string[] = raw;

    if (q.type === 'multi_select') {
      const options = Array.isArray(q.options) ? q.options : [];
      if (q.bitflag) {
        const mask = Number(raw);
        const opts = options
          .filter(opt => (mask & Number(opt.id)) !== 0)
          .map(o => o.label);
        display = opts.join(';');
        store = opts;
      } else {
        const ids = raw.split(';').filter(Boolean);
        const opts = ids.map(
          id => options.find(o => String(o.id) === id)?.label ?? id
        );
        display = opts.join(';');
        store = opts;
      }
    } else if (q.type === 'select') {
      const options = Array.isArray(q.options) ? q.options : [];
      const opt = options.find(o => String(o.id) === raw);
      if (opt) display = opt.label;
      store = display;
    }

    answers[q.id] = store;

    if (filterConditional && q.conditional_on && q.conditional_value) {
      const target = answers[q.conditional_on];
      let visible = false;
      if (Array.isArray(target)) {
        visible = target.some(v =>
          q.conditional_value!.some(c => String(c) === String(v))
        );
      } else {
        visible = q.conditional_value.some(c => String(c) === String(target));
      }
      if (!visible) return;
    }

    result.push({ label: q.label, value: display });
  });

  return result;
}
