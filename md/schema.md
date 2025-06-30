# Questionnaire Template Schema

This document defines the JSON structure used by both **input-app** and **restore-app** to render and interpret department-specific questionnaires. Each department has a template file located at `/templates/DEPT_ID.json`.

## Top-Level Fields

- `department_id` (number): Unique identifier for the department.
- `department_name` (string): Human-readable department name.
- `version` (string): Template or schema version.
- `max_payload_bytes` (number, optional): Recommended upper limit for the encoded QR payload size.
- `questions` (array of Question objects): List of questions to present in order.

## Question Object Properties

Each element in `questions` describes a single field in the questionnaire. All IDs must be unique within the template.

- `id` (string): Unique question identifier.
- `label` (string): Text shown to the user.
- `type` ("text" | "number" | "date" | "select" | "multi_select"): Field type.
- `options` (array of `{ id: number, label: string }`): Required when `type` is `select` or `multi_select`.
- `bitflag` (boolean, optional): For `multi_select`; encode selections as a bitmask when `true`.
- `required` (boolean): Whether a value is mandatory.
- `maxLength` (number, optional): Maximum characters for `text` fields.
- `min` / `max` (number, optional): Numeric bounds for `number` fields.
- `validationRegex` (string, optional): Additional validation pattern.
- `conditional_on` (string, optional): ID of another question that triggers this one.
- `conditional_value` (array, optional): Values that make this question visible.
- `placeholder` (string, optional): Hint text shown in input.
- `defaultValue` (string or number, optional): Initial value displayed.
- `section` (string, optional): Logical grouping label.

## Example Template

```json
{
  "department_id": 1,
  "department_name": "内科",
  "version": "1.0",
  "max_payload_bytes": 1600,
  "questions": [
    {
      "id": "q1",
      "label": "受診予定日",
      "type": "date",
      "required": true
    },
    {
      "id": "q2",
      "label": "症状",
      "type": "multi_select",
      "bitflag": true,
      "options": [
        { "id": 1, "label": "発熱" },
        { "id": 2, "label": "頭痛" }
      ],
      "required": true
    },
    {
      "id": "q3",
      "label": "補足コメント",
      "type": "text",
      "maxLength": 50,
      "conditional_on": "q2",
      "conditional_value": [99]
    }
  ]
}
```

This schema is designed to be extensible and consistent across all departments. Templates adhering to this structure allow both applications to validate input, enforce limits, and display conditional fields reliably.
