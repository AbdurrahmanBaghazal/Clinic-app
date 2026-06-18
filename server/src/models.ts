import mongoose, { Schema } from "mongoose";

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

export interface FormDocument extends mongoose.Document {
  title: string;
  description: string;
  status: "draft" | "published" | "archived";
  fields: FormField[];
  createdBy: mongoose.Types.ObjectId;
}

const fieldSchema = new Schema<FormField>(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, required: true },
    required: { type: Boolean, default: false },
    placeholder: { type: String },
    options: [{ type: String }]
  },
  { _id: false }
);

const formSchema = new Schema<FormDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft"
    },
    fields: [fieldSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

const submissionSchema = new Schema(
  {
    formId: { type: Schema.Types.ObjectId, ref: "Form", required: true },
    patientName: { type: String, default: "" },
    patientEmail: { type: String, default: "" },
    answers: { type: Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

const userSchema = new Schema(
  {
    username: { type: String, unique: true, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin"], default: "admin" }
  },
  { timestamps: true }
);

export const Form = mongoose.model("Form", formSchema);
export const Submission = mongoose.model("Submission", submissionSchema);
export const User = mongoose.model("User", userSchema);

