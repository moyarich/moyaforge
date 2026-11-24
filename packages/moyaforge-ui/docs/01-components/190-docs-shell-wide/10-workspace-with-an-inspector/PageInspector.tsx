import { useId, type ChangeEvent, type FormEvent } from "react";

export interface PageProperties {
  title: string;
  summary: string;
  status: string;
}

interface PageInspectorProps {
  page: PageProperties;
  onChange: (changes: Partial<PageProperties>) => void;
}

/** Edit the selected page while keeping workspace state in the parent. */
export function PageInspector({ page, onChange }: PageInspectorProps) {
  const fieldId = useId();

  function updateField(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.currentTarget;
    if (name === "title" || name === "summary" || name === "status") {
      onChange({ [name]: value });
    }
  }

  function preventSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <form className="workspace-inspector" onSubmit={preventSubmit}>
      <p className="workspace-label">Page properties</p>
      <label htmlFor={`${fieldId}-title`}>Title</label>
      <input
        id={`${fieldId}-title`}
        name="title"
        value={page.title}
        onChange={updateField}
      />
      <label htmlFor={`${fieldId}-summary`}>Summary</label>
      <textarea
        id={`${fieldId}-summary`}
        name="summary"
        rows={5}
        value={page.summary}
        onChange={updateField}
      />
      <label htmlFor={`${fieldId}-status`}>Status</label>
      <select
        id={`${fieldId}-status`}
        name="status"
        value={page.status}
        onChange={updateField}
      >
        <option>Draft</option>
        <option>Published</option>
      </select>
      <p className="workspace-hint">
        Edit these properties to update the page preview.
      </p>
    </form>
  );
}
