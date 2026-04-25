import { useEffect, useState } from "react";
import type { Collection } from "../types/collection";
import type { Snippet, SnippetDraft } from "../types/snippet";
import {
  normalizeMultilineText,
  parseTagInput,
  serializeTags,
} from "../utils/text";

type SnippetFormProps = {
  initialSnippet?: Snippet | null;
  isSaving?: boolean;
  collections?: Collection[];
  defaultCollectionId?: string | null | undefined;
  onSubmit: (input: SnippetDraft) => Promise<void> | void;
  onCancel?: () => void;
};

export function SnippetForm({
  initialSnippet,
  isSaving = false,
  collections = [],
  defaultCollectionId,
  onSubmit,
  onCancel,
}: SnippetFormProps) {
  const [title, setTitle] = useState(initialSnippet?.title ?? "");
  const [body, setBody] = useState(initialSnippet?.body ?? "");
  const [tags, setTags] = useState(serializeTags(initialSnippet?.tags ?? []));
  const [favorite, setFavorite] = useState(initialSnippet?.favorite ?? false);
  const [keyboardHint, setKeyboardHint] = useState(
    initialSnippet?.keyboardHint ?? "",
  );
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(initialSnippet?.collectionId ?? defaultCollectionId ?? null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(initialSnippet?.title ?? "");
    setBody(initialSnippet?.body ?? "");
    setTags(serializeTags(initialSnippet?.tags ?? []));
    setFavorite(initialSnippet?.favorite ?? false);
    setKeyboardHint(initialSnippet?.keyboardHint ?? "");
    setSelectedCollectionId(initialSnippet?.collectionId ?? null);
    setFormError(null);
  }, [initialSnippet]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedBody = normalizeMultilineText(body);

    if (!normalizedBody) {
      setFormError("Snippet body is required.");
      return;
    }

    setFormError(null);

    const nextSnippet: SnippetDraft = {
      title: title.trim(),
      body: normalizedBody,
      tags: parseTagInput(tags),
      favorite,
      collectionId: selectedCollectionId,
      ...(keyboardHint.trim() ? { keyboardHint: keyboardHint.trim() } : {}),
    };

    await Promise.resolve(onSubmit(nextSnippet));
  }

  return (
    <form className="snippet-form" onSubmit={handleSubmit}>
      <div className="panel-heading">
        <div>
          <p className="state-panel__eyebrow">Snippet editor</p>
          <h2 className="panel-heading__title">
            {initialSnippet ? "Edit snippet" : "Create snippet"}
          </h2>
        </div>
      </div>

      <label className="field-group">
        <span className="field-group__label">Title</span>
        <input
          className="field-group__input"
          type="text"
          value={title}
          placeholder="Leave blank to generate from the body"
          onChange={(event) => {
            setTitle(event.target.value);
          }}
        />
      </label>

      <label className="field-group">
        <span className="field-group__label">Body</span>
        <textarea
          className="field-group__input field-group__input--textarea"
          rows={8}
          value={body}
          placeholder="Save a reusable response, prompt, note, or code block"
          onChange={(event) => {
            setBody(event.target.value);
          }}
        />
      </label>

      <div className="field-grid">
        <label className="field-group">
          <span className="field-group__label">Tags</span>
          <input
            className="field-group__input"
            type="text"
            value={tags}
            placeholder="email, support, template"
            onChange={(event) => {
              setTags(event.target.value);
            }}
          />
        </label>

        <label className="field-group">
          <span className="field-group__label">Keyboard hint</span>
          <input
            className="field-group__input"
            type="text"
            value={keyboardHint}
            placeholder="Alt+Shift+1"
            onChange={(event) => {
              setKeyboardHint(event.target.value);
            }}
          />
        </label>
      </div>

      {collections.length > 0 ? (
        <label className="field-group">
          <span className="field-group__label">Collection</span>
          <select
            className="field-group__input field-group__input--select"
            value={selectedCollectionId ?? ""}
            onChange={(event) => {
              setSelectedCollectionId(event.target.value || null);
            }}
          >
            <option value="">Unassigned</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={favorite}
          onChange={(event) => {
            setFavorite(event.target.checked);
          }}
        />
        <span>Mark as favorite</span>
      </label>

      {formError ? (
        <p className="inline-message inline-message--error">{formError}</p>
      ) : null}

      <div className="form-actions">
        <button
          type="submit"
          className="button button--primary"
          disabled={isSaving}
        >
          {isSaving
            ? "Saving..."
            : initialSnippet
              ? "Update snippet"
              : "Save snippet"}
        </button>
        {initialSnippet && onCancel ? (
          <button
            type="button"
            className="button button--ghost"
            onClick={onCancel}
          >
            Cancel edit
          </button>
        ) : null}
      </div>
    </form>
  );
}
