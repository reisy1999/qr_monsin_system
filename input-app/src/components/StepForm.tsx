import React from 'react';
import type { Template, Question } from '../../../shared/templates';
import { isVisible } from '../utils/isVisible';

interface Props {
  template: Template;
  step: number;
  data: Record<string, string | string[]>;
  onChange: (id: string, value: string | string[]) => void;
}

const StepForm: React.FC<Props> = ({ template, step, data, onChange }) => {
  const visibleQuestions = template.questions.filter((q) => isVisible(q, data));
  const field: Question | undefined = visibleQuestions[step];
  if (!field) return null;

  const hasError = (q: Question) => {
    const val = data[q.id];
    if (val === '' || (Array.isArray(val) && val.length === 0)) return false;
    if (q.validationRegex && typeof val === 'string') {
      try {
        if (!new RegExp(q.validationRegex).test(val)) return true;
      } catch {
        // ignore invalid regex
      }
    }
    if (q.type === 'number') {
      const num = Number(val);
      if (q.min !== undefined && num < q.min) return true;
      if (q.max !== undefined && num > q.max) return true;
    }
    if ((q.type === 'text' || q.type === 'textarea') && typeof val === 'string') {
      if (q.maxLength !== undefined && val.length > q.maxLength) return true;
    }
    return false;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target as HTMLInputElement;
    onChange(name, value);
  };

  const handleMultiSelectChange = (
    q: Question,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { value, checked } = e.target;
    if (q.bitflag) {
      const bit = Number(value);
      const current = Number(data[q.id] || 0);
      const updated = checked ? current | bit : current & ~bit;
      onChange(q.id, String(updated));
    } else {
      const current = Array.isArray(data[q.id]) ? (data[q.id] as string[]) : [];
      if (checked) {
        onChange(q.id, [...current, value]);
      } else {
        onChange(q.id, current.filter((v) => v !== value));
      }
    }
  };

  const renderField = (q: Question) => {
    switch (q.type) {
      case 'text':
        return (
          <input
            type="text"
            className={`form-control${hasError(q) ? ' is-invalid' : ''}`}
            name={q.id}
            required={!!q.required}
            maxLength={q.maxLength}
            placeholder={q.placeholder}
            value={(data[q.id] as string) || ''}
            onChange={handleChange}
          />
        );
      case 'textarea':
        return (
          <textarea
            className={`form-control${hasError(q) ? ' is-invalid' : ''}`}
            name={q.id}
            required={!!q.required}
            maxLength={q.maxLength}
            placeholder={q.placeholder}
            value={(data[q.id] as string) || ''}
            onChange={handleChange}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            className={`form-control${hasError(q) ? ' is-invalid' : ''}`}
            name={q.id}
            required={!!q.required}
            value={(data[q.id] as string) || ''}
            min={q.min}
            max={q.max}
            placeholder={q.placeholder}
            onChange={handleChange}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            className={`form-control${hasError(q) ? ' is-invalid' : ''}`}
            name={q.id}
            required={!!q.required}
            value={(data[q.id] as string) || ''}
            placeholder={q.placeholder}
            onChange={handleChange}
          />
        );
      case 'select': {
        const options = Array.isArray(q.options) ? q.options : [];
        return (
          <select
            className={`form-select${hasError(q) ? ' is-invalid' : ''}`}
            name={q.id}
            required={!!q.required}
            value={(data[q.id] as string) || ''}
            onChange={handleChange}
          >
            <option value="">選択してください</option>
            {options.map((opt) => (
              <option key={opt.id} value={String(opt.id)}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      }
      case 'multi_select':
        return (
          <div>
            {(Array.isArray(q.options) ? q.options : []).map((opt) => {
              const optVal = String(opt.id);
              let checked = false;
              if (q.bitflag) {
                const mask = Number(data[q.id] || 0);
                const bit = Number(optVal);
                checked = (mask & bit) !== 0;
              } else {
                checked = Array.isArray(data[q.id])
                  ? (data[q.id] as string[]).includes(optVal)
                  : false;
              }
              return (
                <div className="form-check form-check-inline" key={opt.id}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name={q.id}
                    value={optVal}
                    checked={checked}
                    onChange={(e) => handleMultiSelectChange(q, e)}
                  />
                  <label className="form-check-label">{opt.label}</label>
                </div>
              );
            })}
            {hasError(q) && (
              <div className="invalid-feedback d-block">入力が不正です</div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-100" key={field.id}>
      <label className="form-label">{field.label}</label>
      {renderField(field)}
    </div>
  );
};

export default StepForm;
