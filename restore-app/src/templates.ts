export interface Option {
  id: string | number;
  label: string;
}

export interface Question {
  id: string;
  label: string;
  type: string;
  options?: Option[];
  bitflag?: boolean;
}

export interface Template {
  department_id: number;
  department_name: string;
  questions: Question[];
}

export const departmentMap: { [id: string]: string } = {
  '1': '内科',
  '2': '外科',
  '3': '小児科',
  '4': '整形外科',
};

