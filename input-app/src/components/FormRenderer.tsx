import React from 'react';
import type { Template, Question } from '../../../shared/templates';

interface Props {
  template: Template;
  data: Record<string, string | string[]>;
  onChange: (id: string, value: string | string[]) => void;
}

export const FormRenderer: React.FC<Props> = ({ template, data, onChange }) => {
  const isVisible = (q: Question) => {
    if (!q.conditional_on || !q.conditional_value) return true;
    const target = data[q.conditional_on];
    if (Array.isArray(target)) {
      return target.some((v) => q.conditional_value!.includes(v));
    }
    return q.conditional_value.includes(target as string | number);
  };

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
    const { name, value, type, checked } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
      const current = (data[name] as string[]) || [];
      if (checked) {
        onChange(name, [...current, value]);
      } else {
        onChange(
          name,
          current.filter((v) => v !== value)
        );
      }
    } else {
      onChange(name, value);
    }
  };

  const handleMultiSelectChange = (
    field: Question,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { value, checked } = e.target;
    if (field.bitflag) {
      const bit = 1 << (Number(value) - 1);
      const current = Number(data[field.id] || 0);
      const updated = checked ? current | bit : current & ~bit;
      onChange(field.id, String(updated));
    } else {
      const current = Array.isArray(data[field.id]) ? (data[field.id] as string[]) : [];
      if (checked) {
        onChange(field.id, [...current, value]);
      } else {
        onChange(field.id, current.filter((v) => v !== value));
      }
    }
  };

  const renderField = (field: Question) => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            className={`form-control${hasError(field) ? ' is-invalid' : ''}`}
            name={field.id}
            required={!!field.required}
            maxLength={field.maxLength}
            value={(data[field.id] as string) || ''}
            onChange={handleChange}
          />
        );
      case 'textarea':
        return (
          <textarea
            className={`form-control${hasError(field) ? ' is-invalid' : ''}`}
            name={field.id}
            required={!!field.required}
            maxLength={field.maxLength}
            value={(data[field.id] as string) || ''}
            onChange={handleChange}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            className={`form-control${hasError(field) ? ' is-invalid' : ''}`}
            name={field.id}
            required={!!field.required}
            value={(data[field.id] as string) || ''}
            min={field.min}
            max={field.max}
            onChange={handleChange}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            className={`form-control${hasError(field) ? ' is-invalid' : ''}`}
            name={field.id}
            required={!!field.required}
            value={(data[field.id] as string) || ''}
            onChange={handleChange}
          />
        );
      case 'select':
        return (
          <select
            className={`form-select${hasError(field) ? ' is-invalid' : ''}`}
            name={field.id}
            required={!!field.required}
            value={(data[field.id] as string) || ''}
            onChange={handleChange}
          >
            <option value="">選択してください</option>
            {field.options?.map((opt) => (
              <option key={opt.id} value={String(opt.id)}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <div>
            {field.options?.map((opt) => {
              const checked = Array.isArray(data[field.id])
                ? (data[field.id] as string[]).includes(String(opt.id))
                : false;
              return (
                <div className="form-check form-check-inline" key={opt.id}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name={field.id}
                    value={String(opt.id)}
                    checked={checked}
                    onChange={handleChange}
                  />
                  <label className="form-check-label">{opt.label}</label>
                </div>
              );
            })}
            {hasError(field) && (
              <div className="invalid-feedback d-block">入力が不正です</div>
            )}
          </div>
        );
      case 'multi_select':
        return (
          <div>
            {field.options?.map((opt) => {
              const optVal = String(opt.id);
              let checked = false;
              if (field.bitflag) {
                const mask = Number(data[field.id] || 0);
                const bit = 1 << (Number(optVal) - 1);
                checked = (mask & bit) !== 0;
              } else {
                checked = Array.isArray(data[field.id])
                  ? (data[field.id] as string[]).includes(optVal)
                  : false;
              }
              return (
                <div className="form-check form-check-inline" key={opt.id}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name={field.id}
                    value={optVal}
                    checked={checked}
                    onChange={(e) => handleMultiSelectChange(field, e)}
                  />
                  <label className="form-check-label">{opt.label}</label>
                </div>
              );
            })}
            {hasError(field) && (
              <div className="invalid-feedback d-block">入力が不正です</div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {template.questions.map((q) =>
        isVisible(q) ? (
          <div className="mb-3" key={q.id}>
            <label className="form-label">{q.label}</label>
            {renderField(q)}
          </div>
        ) : null
      )}
    </div>
  );
};
