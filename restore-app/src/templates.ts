export interface Option {
  value: string;
  label: string;
}

export interface Field {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox';
  options?: Option[];
}

export interface Template {
  departmentName: string;
  fields: Field[];
}

export const departmentMap: { [id: string]: string } = {
  '1': '内科',
  '2': '外科',
  '3': '小児科',
  '4': '整形外科',
};

const baseFields: Field[] = [
  { name: 'name', label: '氏名', type: 'text' },
  { name: 'birthYear', label: '生年月日（年）', type: 'number' },
  { name: 'birthMonth', label: '月', type: 'number' },
  { name: 'birthDay', label: '日', type: 'number' },
  { name: 'age', label: '年齢', type: 'number' },
  {
    name: 'gender',
    label: '性別',
    type: 'select',
    options: [
      { value: '1', label: '男性' },
      { value: '2', label: '女性' },
      { value: '3', label: 'その他' },
    ],
  },
  {
    name: 'symptoms',
    label: '症状',
    type: 'checkbox',
    options: [
      { value: '3', label: '頭痛' },
      { value: '4', label: '腹痛' },
      { value: '6', label: '発熱' },
    ],
  },
  {
    name: 'duration',
    label: '症状の期間',
    type: 'select',
    options: [
      { value: '1', label: '1日以内' },
      { value: '2', label: '2-3日' },
      { value: '3', label: '1週間以上' },
    ],
  },
  {
    name: 'history',
    label: '既往歴',
    type: 'checkbox',
    options: [
      { value: '8', label: '高血圧' },
      { value: '1', label: '糖尿病' },
      { value: '2', label: '心臓病' },
    ],
  },
  { name: 'freeText', label: '自由記述', type: 'text' },
];

export const templates: { [id: string]: Template } = {
  '1': { departmentName: departmentMap['1'], fields: baseFields },
  '2': { departmentName: departmentMap['2'], fields: baseFields },
  '3': { departmentName: departmentMap['3'], fields: baseFields },
  '4': { departmentName: departmentMap['4'], fields: baseFields },
};

