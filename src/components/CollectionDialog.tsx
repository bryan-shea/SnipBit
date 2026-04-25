import { startTransition, useEffect, useRef, useState } from "react";
import type { Collection, CollectionDraft } from "../types/collection";
import { XIcon } from "./ui/icons";

const PALETTE: Array<{ value: string; label: string }> = [
  { value: "#6366f1", label: "Indigo" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#ec4899", label: "Pink" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#10b981", label: "Emerald" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#f97316", label: "Orange" },
  { value: "#64748b", label: "Slate" },
];

const DEFAULT_COLOR = PALETTE[0]!.value;

type CollectionDialogProps = {
  open: boolean;
  existingCollection?: Collection | null;
  existingNames: string[];
  onConfirm: (draft: CollectionDraft) => Promise<void>;
  onClose: () => void;
};

export function CollectionDialog({
  open,
  existingCollection,
  existingNames,
  onConfirm,
  onClose,
}: CollectionDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    startTransition(() => {
      setName(existingCollection?.name ?? "");
      setDescription(existingCollection?.description ?? "");
      setColor(existingCollection?.color ?? DEFAULT_COLOR);
      setNameError(null);
      setIsSaving(false);
    });

    const timeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    return () => clearTimeout(timeout);
  }, [open, existingCollection]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setNameError("Collection name is required.");
      return;
    }

    const otherNames = existingNames.filter(
      (n) => n.toLowerCase() !== (existingCollection?.name ?? "").toLowerCase(),
    );
    const isDuplicate = otherNames.some(
      (n) => n.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (isDuplicate) {
      setNameError("A collection with this name already exists.");
      return;
    }

    setNameError(null);
    setIsSaving(true);

    try {
      await onConfirm({
        name: trimmedName,
        ...(description.trim() ? { description: description.trim() } : {}),
        color,
      });
      onClose();
    } catch {
      setIsSaving(false);
    }
  }

  function handleBackdropClick(event: React.MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onClick={handleBackdropClick}
    >
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="collection-dialog-title"
      >
        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="dialog__content">
            <div className="dialog__header">
              <h2 id="collection-dialog-title" className="dialog__title">
                {existingCollection ? "Edit collection" : "New collection"}
              </h2>
              <button
                type="button"
                className="icon-button"
                aria-label="Close dialog"
                onClick={onClose}
              >
                <XIcon size={14} />
              </button>
            </div>

            <div className="field-group">
              <label htmlFor="collection-name" className="field-group__label">
                Name
              </label>
              <input
                ref={inputRef}
                id="collection-name"
                className="field-group__input"
                type="text"
                value={name}
                placeholder="e.g. Work templates"
                aria-describedby={
                  nameError ? "collection-name-error" : undefined
                }
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError(null);
                }}
              />
              {nameError ? (
                <p
                  id="collection-name-error"
                  className="inline-message inline-message--error"
                >
                  {nameError}
                </p>
              ) : null}
            </div>

            <div className="field-group">
              <label
                htmlFor="collection-description"
                className="field-group__label"
              >
                Description{" "}
                <span style={{ fontWeight: 400, color: "var(--ink-400)" }}>
                  (optional)
                </span>
              </label>
              <input
                id="collection-description"
                className="field-group__input"
                type="text"
                value={description}
                placeholder="What this collection is for"
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <p className="field-group__label" style={{ marginBottom: 8 }}>
                Color
              </p>
              <div
                className="color-palette"
                role="group"
                aria-label="Collection color"
              >
                {PALETTE.map((swatch) => (
                  <button
                    key={swatch.value}
                    type="button"
                    className={`color-swatch${color === swatch.value ? " color-swatch--selected" : ""}`}
                    style={
                      { "--swatch-color": swatch.value } as React.CSSProperties
                    }
                    aria-label={swatch.label}
                    aria-pressed={color === swatch.value}
                    onClick={() => setColor(swatch.value)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="dialog__actions">
            <button
              type="button"
              className="button button--ghost button--sm"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button--primary button--sm"
              disabled={isSaving}
            >
              {isSaving
                ? "Saving..."
                : existingCollection
                  ? "Save changes"
                  : "Create collection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
