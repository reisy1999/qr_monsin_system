export interface Option {
  id: string | number;
  label: string;
}

export interface Question {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multi_select' | string;
  options?: Option[];
  bitflag?: boolean;
  required?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  validationRegex?: string;
  conditional_on?: string;
  conditional_value?: Array<string | number>;
  placeholder?: string;
  defaultValue?: string | number;
  section?: string;
}

export interface Template {
  department_id: number;
  department_name: string;
  version: string;
  max_payload_bytes?: number;
  questions: Question[];
}

export const departmentMap: { [id: string]: string } = {
  '1': '内科',
  '2': '外科',
  '3': '小児科',
  '4': '整形外科',
};
