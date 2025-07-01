import type { Question } from '@shared/templates';

export function isVisible(question: Question, answers: Record<string, string | string[]>): boolean {
  if (!question.conditional_on || !question.conditional_value) return true;
  const target = answers[question.conditional_on];
  if (Array.isArray(target)) {
    return target.some((v) =>
      question.conditional_value!.some((c) => String(c) === String(v))
    );
  }
  return question.conditional_value.some((c) => String(c) === String(target));
}
