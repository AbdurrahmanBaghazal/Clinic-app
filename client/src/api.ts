import type { FormRecord, SubmissionRecord } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";
const TOKEN_KEY = "praxis-form-token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const token = getToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(data.message ?? "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    }),
  listForms: () => request<FormRecord[]>("/forms"),
  listPublicForms: () => request<FormRecord[]>("/forms/public"),
  getPublicForm: (id: string) => request<FormRecord>(`/forms/public/${id}`),
  createForm: (form: Omit<FormRecord, "_id">) =>
    request<FormRecord>("/forms", {
      method: "POST",
      body: JSON.stringify(form)
    }),
  updateForm: (form: FormRecord) =>
    request<FormRecord>(`/forms/${form._id}`, {
      method: "PUT",
      body: JSON.stringify(form)
    }),
  deleteForm: (id: string) =>
    request<void>(`/forms/${id}`, {
      method: "DELETE"
    }),
  listSubmissions: () => request<SubmissionRecord[]>("/submissions"),
  submitForm: (
    id: string,
    payload: Pick<SubmissionRecord, "patientName" | "patientEmail" | "answers">
  ) =>
    request<SubmissionRecord>(`/forms/${id}/submissions`, {
      method: "POST",
      body: JSON.stringify(payload)
    })
};
