import React from 'react';
import type { Template, Question } from '../templates';

interface Props {
  template: Template;
  data: Record<string, string | string[]>;
  onChange: (id: string, value: string | string[]) => void;
}

export const FormRenderer: React.FC<Props> = ({ template, data, onChange }) => {
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

  const renderField = (field: Question) => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            className="form-control"
            name={field.id}
            required={!!field.required}
            value={(data[field.id] as string) || ''}
            onChange={handleChange}
          />
        );
      case 'textarea':
        return (
          <textarea
            className="form-control"
            name={field.id}
            required={!!field.required}
            value={(data[field.id] as string) || ''}
            onChange={handleChange}
          />
        );
      case 'select':
        return (
          <select
            className="form-select"
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
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {template.questions.map((q) => (
        <div className="mb-3" key={q.id}>
          <label className="form-label">{q.label}</label>
          {renderField(q)}
        </div>
      ))}
    </div>
  );
};
