export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "phone"
  | "number"
  | "date"
  | "checkbox"
  | "select"
  | "radio";

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface FormRecord {
  _id: string;
  title: string;
  description: string;
  status: "draft" | "published" | "archived";
  fields: FormField[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SubmissionRecord {
  _id: string;
  formId: string | { _id: string; title: string };
  patientName: string;
  patientEmail: string;
  answers: Record<string, string | boolean | number | string[]>;
  createdAt: string;
}

