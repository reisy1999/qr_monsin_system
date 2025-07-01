export const departmentMap: { [id: string]: string } = {
  '1': '内科',
  '2': '外科',
};

export type Question = {
  id: string;
  type: 'text' | 'select' | 'checkbox' | 'multi_select' | string;
  label: string;
  options?: Array<{ id: string | number; label: string }>;
  bitflag?: boolean;
};

export type Template = {
  id: string;
  title: string;
  questions: Question[];
};
