import { z } from "zod";

const fieldTypeSchema = z.enum([
  "text",
  "textarea",
  "email",
  "phone",
  "number",
  "date",
  "checkbox",
  "select",
  "radio"
]);

export const formSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional().default(""),
  status: z.enum(["draft", "published", "archived"]).optional().default("draft"),
  fields: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        type: fieldTypeSchema,
        required: z.boolean().default(false),
        placeholder: z.string().optional(),
        options: z.array(z.string()).optional()
      })
    )
    .min(1)
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export const submissionSchema = z.object({
  patientName: z.string().optional().default(""),
  patientEmail: z.string().email().optional().or(z.literal("")).default(""),
  answers: z.record(z.union([z.string(), z.boolean(), z.number(), z.array(z.string())]))
});

