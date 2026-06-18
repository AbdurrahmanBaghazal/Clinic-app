import { Form, User } from "./models.js";

export async function ensureSampleForm() {
  const admin = await User.findOne({ username: process.env.ADMIN_USERNAME ?? "admin" });
  const existing = await Form.findOne({ title: "Patient Intake Form" });

  if (!admin || existing) {
    return;
  }

  await Form.create({
    title: "Patient Intake Form",
    description: "Collect patient contact details and first appointment information.",
    status: "published",
    createdBy: admin._id,
    fields: [
      {
        id: "fullName",
        label: "Full name",
        type: "text",
        required: true,
        placeholder: "Jane Patient"
      },
      {
        id: "email",
        label: "Email address",
        type: "email",
        required: true,
        placeholder: "jane@example.com"
      },
      {
        id: "phone",
        label: "Phone number",
        type: "phone",
        required: true,
        placeholder: "+49 ..."
      },
      {
        id: "birthDate",
        label: "Date of birth",
        type: "date",
        required: true
      },
      {
        id: "visitReason",
        label: "Reason for visit",
        type: "textarea",
        required: true,
        placeholder: "Briefly describe your symptoms or request"
      },
      {
        id: "insurance",
        label: "Insurance type",
        type: "radio",
        required: true,
        options: ["Public", "Private", "Self-pay"]
      },
      {
        id: "consent",
        label: "I consent to the processing of my submitted information",
        type: "checkbox",
        required: true
      }
    ]
  });
}

