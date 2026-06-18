import {
  Archive,
  ClipboardList,
  Eye,
  FileText,
  LogOut,
  Plus,
  Save,
  Send,
  Trash2
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, clearToken, getToken, setToken } from "./api";
import type { FieldType, FormField, FormRecord, SubmissionRecord } from "./types";

const fieldTypes: FieldType[] = [
  "text",
  "textarea",
  "email",
  "phone",
  "number",
  "date",
  "checkbox",
  "select",
  "radio"
];

const starterForm: Omit<FormRecord, "_id"> = {
  title: "New Patient Form",
  description: "Collect the information needed before an appointment.",
  status: "draft",
  fields: [
    {
      id: "fullName",
      label: "Full name",
      type: "text",
      required: true,
      placeholder: "Jane Patient"
    }
  ]
};

function createField(): FormField {
  const id = `field_${Date.now()}`;

  return {
    id,
    label: "New field",
    type: "text",
    required: false,
    placeholder: ""
  };
}

function formatDate(value?: string) {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function App() {
  const [route, setRoute] = useState(window.location.pathname);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getToken()));

  useEffect(() => {
    const onPopState = () => setRoute(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function navigate(path: string) {
    window.history.pushState({}, "", path);
    setRoute(path);
  }

  function logout() {
    clearToken();
    setIsAuthenticated(false);
    navigate("/login");
  }

  if (route.startsWith("/public/form/")) {
    return <PublicForm formId={route.replace("/public/form/", "")} navigate={navigate} />;
  }

  if (route === "/" || route === "/public") {
    return <PublicForms navigate={navigate} />;
  }

  if (!isAuthenticated || route === "/login") {
    return <Login onLogin={() => setIsAuthenticated(true)} navigate={navigate} />;
  }

  return <AdminShell navigate={navigate} route={route} logout={logout} />;
}

function Login({ onLogin, navigate }: { onLogin: () => void; navigate: (path: string) => void }) {
  const [username, setUsername] = useState("admin");
  const [password, setPasswordValue] = useState("admin123");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { token } = await api.login(username, password);
      setToken(token);
      onLogin();
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div>
          <p className="eyebrow">Praxis Form</p>
          <h1>Admin login</h1>
          <p className="muted">Manage patient-facing forms, publish updates, and review submissions.</p>
        </div>
        <form onSubmit={submit} className="stack">
          <label>
            Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPasswordValue(event.target.value)}
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="primary" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}

function AdminShell({
  navigate,
  route,
  logout
}: {
  navigate: (path: string) => void;
  route: string;
  logout: () => void;
}) {
  const [forms, setForms] = useState<FormRecord[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedForm = forms.find((form) => form._id === selectedId) ?? forms[0];
  const view = route === "/admin/submissions" ? "submissions" : "forms";

  async function load() {
    try {
      const [formsData, submissionsData] = await Promise.all([api.listForms(), api.listSubmissions()]);
      setForms(formsData);
      setSubmissions(submissionsData);
      setSelectedId((current) => current ?? formsData[0]?._id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load dashboard data");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveForm(form: FormRecord | Omit<FormRecord, "_id">) {
    setError("");
    setMessage("");

    try {
      const saved = "_id" in form ? await api.updateForm(form) : await api.createForm(form);
      setMessage("Form saved");
      await load();
      setSelectedId(saved._id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save form");
    }
  }

  async function deleteForm(id: string) {
    setError("");
    setMessage("");
    await api.deleteForm(id);
    setMessage("Form deleted");
    await load();
  }

  const metrics = useMemo(
    () => ({
      published: forms.filter((form) => form.status === "published").length,
      draft: forms.filter((form) => form.status === "draft").length,
      submissions: submissions.length
    }),
    [forms, submissions]
  );

  return (
    <main className="admin-layout">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Praxis Form</p>
          <h1>Workspace</h1>
        </div>
        <nav>
          <button className={view === "forms" ? "nav-active" : ""} onClick={() => navigate("/admin")}>
            <FileText size={18} /> Forms
          </button>
          <button
            className={view === "submissions" ? "nav-active" : ""}
            onClick={() => navigate("/admin/submissions")}
          >
            <ClipboardList size={18} /> Submissions
          </button>
        </nav>
        <button className="ghost" onClick={logout}>
          <LogOut size={18} /> Sign out
        </button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <h2>{view === "forms" ? "Form management" : "Submission inbox"}</h2>
            <p className="muted">Build and publish structured intake forms for patients.</p>
          </div>
          <div className="top-actions">
            <button className="secondary" onClick={() => navigate("/")}>
              <Eye size={18} /> Public view
            </button>
            {view === "forms" && (
              <button className="primary" onClick={() => void saveForm(starterForm)}>
                <Plus size={18} /> New form
              </button>
            )}
          </div>
        </header>

        <section className="metrics">
          <article>
            <span>{forms.length}</span>
            <p>Total forms</p>
          </article>
          <article>
            <span>{metrics.published}</span>
            <p>Published</p>
          </article>
          <article>
            <span>{metrics.draft}</span>
            <p>Drafts</p>
          </article>
          <article>
            <span>{metrics.submissions}</span>
            <p>Submissions</p>
          </article>
        </section>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        {view === "forms" ? (
          <section className="split">
            <FormList forms={forms} selectedId={selectedForm?._id} onSelect={setSelectedId} />
            {selectedForm ? (
              <FormEditor form={selectedForm} onSave={saveForm} onDelete={deleteForm} />
            ) : (
              <div className="empty-state">Create your first form to begin.</div>
            )}
          </section>
        ) : (
          <Submissions submissions={submissions} forms={forms} />
        )}
      </section>
    </main>
  );
}

function FormList({
  forms,
  selectedId,
  onSelect
}: {
  forms: FormRecord[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="list-panel">
      {forms.map((form) => (
        <button
          key={form._id}
          className={form._id === selectedId ? "form-row selected" : "form-row"}
          onClick={() => onSelect(form._id)}
        >
          <span>{form.title}</span>
          <small>{form.status}</small>
        </button>
      ))}
    </div>
  );
}

function FormEditor({
  form,
  onSave,
  onDelete
}: {
  form: FormRecord;
  onSave: (form: FormRecord) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState<FormRecord>(form);

  useEffect(() => {
    setDraft(form);
  }, [form]);

  function updateField(index: number, patch: Partial<FormField>) {
    setDraft((current) => ({
      ...current,
      fields: current.fields.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, ...patch } : field
      )
    }));
  }

  function removeField(index: number) {
    setDraft((current) => ({
      ...current,
      fields: current.fields.filter((_, fieldIndex) => fieldIndex !== index)
    }));
  }

  return (
    <div className="editor">
      <div className="editor-header">
        <div>
          <h3>{draft.title}</h3>
          <p className="muted">Last updated {formatDate(draft.updatedAt)}</p>
        </div>
        <div className="top-actions">
          <button className="danger" onClick={() => void onDelete(draft._id)} title="Delete form">
            <Trash2 size={18} />
          </button>
          <button className="primary" onClick={() => void onSave(draft)}>
            <Save size={18} /> Save
          </button>
        </div>
      </div>

      <div className="form-grid">
        <label>
          Title
          <input
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          />
        </label>
        <label>
          Status
          <select
            value={draft.status}
            onChange={(event) => setDraft({ ...draft, status: event.target.value as FormRecord["status"] })}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>

      <label>
        Description
        <textarea
          value={draft.description}
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
        />
      </label>

      <div className="section-title">
        <h4>Fields</h4>
        <button
          className="secondary"
          onClick={() => setDraft((current) => ({ ...current, fields: [...current.fields, createField()] }))}
        >
          <Plus size={18} /> Add field
        </button>
      </div>

      <div className="field-stack">
        {draft.fields.map((field, index) => (
          <article className="field-editor" key={field.id}>
            <div className="form-grid">
              <label>
                Label
                <input
                  value={field.label}
                  onChange={(event) => updateField(index, { label: event.target.value })}
                />
              </label>
              <label>
                Type
                <select
                  value={field.type}
                  onChange={(event) => updateField(index, { type: event.target.value as FieldType })}
                >
                  {fieldTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Placeholder
              <input
                value={field.placeholder ?? ""}
                onChange={(event) => updateField(index, { placeholder: event.target.value })}
              />
            </label>
            {(field.type === "select" || field.type === "radio") && (
              <label>
                Options
                <input
                  value={(field.options ?? []).join(", ")}
                  onChange={(event) =>
                    updateField(index, {
                      options: event.target.value
                        .split(",")
                        .map((option) => option.trim())
                        .filter(Boolean)
                    })
                  }
                />
              </label>
            )}
            <div className="field-actions">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(event) => updateField(index, { required: event.target.checked })}
                />
                Required
              </label>
              <button className="ghost danger-text" onClick={() => removeField(index)}>
                <Trash2 size={16} /> Remove
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Submissions({
  submissions,
  forms
}: {
  submissions: SubmissionRecord[];
  forms: FormRecord[];
}) {
  return (
    <section className="submission-grid">
      {submissions.map((submission) => {
        const title =
          typeof submission.formId === "object"
            ? submission.formId.title
            : forms.find((form) => form._id === submission.formId)?.title ?? "Form";

        return (
          <article className="submission" key={submission._id}>
            <header>
              <div>
                <h3>{submission.patientName || "Unnamed patient"}</h3>
                <p className="muted">{title}</p>
              </div>
              <small>{formatDate(submission.createdAt)}</small>
            </header>
            <dl>
              {Object.entries(submission.answers).map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{String(value)}</dd>
                </div>
              ))}
            </dl>
          </article>
        );
      })}
      {!submissions.length && <div className="empty-state">No submissions yet.</div>}
    </section>
  );
}

function PublicForms({ navigate }: { navigate: (path: string) => void }) {
  const [forms, setForms] = useState<FormRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listPublicForms().then(setForms).catch((err) => setError(err.message));
  }, []);

  return (
    <main className="public-page">
      <header className="public-header">
        <div>
          <p className="eyebrow">Praxis Form</p>
          <h1>Patient forms</h1>
          <p className="muted">Choose the form requested by the practice.</p>
        </div>
        <button className="secondary" onClick={() => navigate("/login")}>
          Admin
        </button>
      </header>
      {error && <p className="error">{error}</p>}
      <section className="public-list">
        {forms.map((form) => (
          <button key={form._id} className="public-form-row" onClick={() => navigate(`/public/form/${form._id}`)}>
            <span>{form.title}</span>
            <small>{form.description}</small>
          </button>
        ))}
      </section>
    </main>
  );
}

function PublicForm({ formId, navigate }: { formId: string; navigate: (path: string) => void }) {
  const [form, setForm] = useState<FormRecord | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | boolean | number | string[]>>({});
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.getPublicForm(formId).then(setForm).catch((err) => setError(err.message));
  }, [formId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await api.submitForm(formId, { patientName, patientEmail, answers });
      setMessage("Your form has been submitted.");
      setAnswers({});
      setPatientName("");
      setPatientEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit form");
    }
  }

  if (!form) {
    return (
      <main className="public-page">
        {error ? <p className="error">{error}</p> : <p className="muted">Loading form...</p>}
      </main>
    );
  }

  return (
    <main className="public-page">
      <button className="ghost back-button" onClick={() => navigate("/")}>
        Back to forms
      </button>
      <section className="patient-form">
        <header>
          <p className="eyebrow">Praxis Form</p>
          <h1>{form.title}</h1>
          <p className="muted">{form.description}</p>
        </header>
        <form onSubmit={submit} className="stack">
          <div className="form-grid">
            <label>
              Patient name
              <input value={patientName} onChange={(event) => setPatientName(event.target.value)} />
            </label>
            <label>
              Patient email
              <input
                type="email"
                value={patientEmail}
                onChange={(event) => setPatientEmail(event.target.value)}
              />
            </label>
          </div>
          {form.fields.map((field) => (
            <FieldInput
              key={field.id}
              field={field}
              value={answers[field.id]}
              onChange={(value) => setAnswers((current) => ({ ...current, [field.id]: value }))}
            />
          ))}
          {message && <p className="success">{message}</p>}
          {error && <p className="error">{error}</p>}
          <button className="primary">
            <Send size={18} /> Submit form
          </button>
        </form>
      </section>
    </main>
  );
}

function FieldInput({
  field,
  value,
  onChange
}: {
  field: FormField;
  value: string | boolean | number | string[] | undefined;
  onChange: (value: string | boolean | number | string[]) => void;
}) {
  if (field.type === "textarea") {
    return (
      <label>
        {field.label}
        <textarea
          required={field.required}
          placeholder={field.placeholder}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="checkbox-row">
        <input
          type="checkbox"
          required={field.required}
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
        />
        {field.label}
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label>
        {field.label}
        <select
          required={field.required}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Choose...</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "radio") {
    return (
      <fieldset>
        <legend>{field.label}</legend>
        <div className="option-row">
          {(field.options ?? []).map((option) => (
            <label className="checkbox-row" key={option}>
              <input
                type="radio"
                name={field.id}
                required={field.required}
                checked={value === option}
                onChange={() => onChange(option)}
              />
              {option}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  return (
    <label>
      {field.label}
      <input
        type={field.type === "phone" ? "tel" : field.type}
        required={field.required}
        placeholder={field.placeholder}
        value={String(value ?? "")}
        onChange={(event) => onChange(field.type === "number" ? Number(event.target.value) : event.target.value)}
      />
    </label>
  );
}

