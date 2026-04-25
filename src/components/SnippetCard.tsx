import type { Snippet } from "../types/snippet";
import { formatRelativeTimestamp } from "../utils/dates";
import { createSnippetPreview } from "../utils/text";
import {
  CopyIcon,
  DuplicateIcon,
  PencilIcon,
  StarFilledIcon,
  StarOutlineIcon,
  TrashIcon,
} from "./ui/icons";

type SnippetCardProps = {
  snippet: Snippet;
  variant?: "popup" | "manager";
  collectionName?: string | undefined;
  collectionColor?: string | undefined;
  onCopy: (snippet: Snippet) => void;
  onEdit?: (snippet: Snippet) => void;
  onDuplicate?: (snippet: Snippet) => void;
  onDelete?: (snippet: Snippet) => void;
  onToggleFavorite?: (snippet: Snippet) => void;
};

export function SnippetCard({
  snippet,
  variant = "popup",
  collectionName,
  collectionColor,
  onCopy,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleFavorite,
}: SnippetCardProps) {
  const isManager = variant === "manager";

  return (
    <article className={`snippet-card snippet-card--${variant}`}>
      {/* Header: title + copy button */}
      <div className="snippet-card__header">
        <div className="snippet-card__heading">
          <div className="snippet-card__title-row">
            {isManager && onToggleFavorite ? (
              <button
                type="button"
                className={`icon-button${snippet.favorite ? " icon-button--active" : ""}`}
                onClick={() => onToggleFavorite(snippet)}
                aria-label={
                  snippet.favorite
                    ? `Remove "${snippet.title}" from favorites`
                    : `Add "${snippet.title}" to favorites`
                }
              >
                {snippet.favorite ? (
                  <StarFilledIcon size={14} />
                ) : (
                  <StarOutlineIcon size={14} />
                )}
              </button>
            ) : null}
            <h3 className="snippet-card__title">{snippet.title}</h3>
          </div>
          <p className="snippet-card__meta">
            {formatRelativeTimestamp(snippet.updatedAt)}
            {snippet.sourceTitle ? ` · ${snippet.sourceTitle}` : ""}
          </p>
        </div>
        <button
          type="button"
          className="button button--primary button--sm"
          onClick={() => onCopy(snippet)}
          aria-label={`Copy "${snippet.title}" to clipboard`}
        >
          <CopyIcon size={12} />
          Copy
        </button>
      </div>

      {/* Body preview */}
      <p className="snippet-card__preview">
        {createSnippetPreview(snippet.body, isManager ? 200 : 110)}
      </p>

      {/* Footer: tags left, manager actions right */}
      <div className="snippet-card__footer">
        <div className="snippet-card__tags">
          {collectionName ? (
            <span
              className="badge badge--collection"
              style={
                collectionColor
                  ? { borderColor: collectionColor, color: collectionColor }
                  : undefined
              }
            >
              {collectionName}
            </span>
          ) : null}
          {snippet.tags.map((tag) => (
            <span key={tag} className="badge">
              {tag}
            </span>
          ))}
          {snippet.keyboardHint ? (
            <span className="badge badge--muted">{snippet.keyboardHint}</span>
          ) : null}
        </div>

        {isManager ? (
          <div className="snippet-card__actions">
            {onEdit ? (
              <button
                type="button"
                className="icon-button"
                onClick={() => onEdit(snippet)}
                aria-label={`Edit "${snippet.title}"`}
              >
                <PencilIcon size={14} />
              </button>
            ) : null}
            {onDuplicate ? (
              <button
                type="button"
                className="icon-button"
                onClick={() => onDuplicate(snippet)}
                aria-label={`Duplicate "${snippet.title}"`}
              >
                <DuplicateIcon size={14} />
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                className="icon-button icon-button--danger"
                onClick={() => onDelete(snippet)}
                aria-label={`Delete "${snippet.title}"`}
              >
                <TrashIcon size={14} />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
