import { Router } from "express";
import { Types } from "mongoose";
import { login, requireAuth, type AuthRequest } from "./auth.js";
import { Form, Submission } from "./models.js";
import { formSchema, loginSchema, submissionSchema } from "./validation.js";

export const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.post("/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid login payload" });
  }

  const token = await login(parsed.data.username, parsed.data.password);

  if (!token) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  return res.json({ token });
});

router.get("/forms/public", async (_req, res) => {
  const forms = await Form.find({ status: "published" }).sort({ updatedAt: -1 });
  res.json(forms);
});

router.get("/forms/public/:id", async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ message: "Form not found" });
  }

  const form = await Form.findOne({ _id: req.params.id, status: "published" });

  if (!form) {
    return res.status(404).json({ message: "Form not found" });
  }

  return res.json(form);
});

router.post("/forms/:id/submissions", async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ message: "Form not found" });
  }

  const form = await Form.findOne({ _id: req.params.id, status: "published" });

  if (!form) {
    return res.status(404).json({ message: "Form not found" });
  }

  const parsed = submissionSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid submission payload" });
  }

  for (const field of form.fields) {
    const value = parsed.data.answers[field.id];

    if (field.required && (value === undefined || value === "" || value === false)) {
      return res.status(400).json({ message: `${field.label} is required` });
    }
  }

  const submission = await Submission.create({
    formId: form._id,
    patientName: parsed.data.patientName,
    patientEmail: parsed.data.patientEmail,
    answers: parsed.data.answers
  });

  return res.status(201).json(submission);
});

router.use(requireAuth);

router.get("/forms", async (_req, res) => {
  const forms = await Form.find().sort({ updatedAt: -1 });
  res.json(forms);
});

router.post("/forms", async (req: AuthRequest, res) => {
  const parsed = formSchema.safeParse(req.body);

  if (!parsed.success || !req.userId) {
    return res.status(400).json({ message: "Invalid form payload" });
  }

  const form = await Form.create({
    ...parsed.data,
    createdBy: req.userId
  });

  return res.status(201).json(form);
});

router.put("/forms/:id", async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ message: "Form not found" });
  }

  const parsed = formSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid form payload" });
  }

  const form = await Form.findByIdAndUpdate(req.params.id, parsed.data, {
    new: true
  });

  if (!form) {
    return res.status(404).json({ message: "Form not found" });
  }

  return res.json(form);
});

router.delete("/forms/:id", async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ message: "Form not found" });
  }

  await Submission.deleteMany({ formId: req.params.id });
  await Form.findByIdAndDelete(req.params.id);
  return res.status(204).send();
});

router.get("/submissions", async (_req, res) => {
  const submissions = await Submission.find().populate("formId", "title").sort({ createdAt: -1 });
  res.json(submissions);
});

router.get("/forms/:id/submissions", async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ message: "Form not found" });
  }

  const submissions = await Submission.find({ formId: req.params.id }).sort({ createdAt: -1 });
  res.json(submissions);
});

