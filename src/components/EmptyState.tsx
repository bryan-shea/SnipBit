function SnippetIllustration() {
  return (
    <svg
      width="52"
      height="52"
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="3"
        width="42"
        height="46"
        rx="5"
        fill="var(--surface-sunken)"
        stroke="var(--border-strong)"
        strokeWidth="1.5"
      />
      <rect
        x="12"
        y="14"
        width="28"
        height="2.5"
        rx="1.25"
        fill="var(--border-strong)"
      />
      <rect
        x="12"
        y="21"
        width="20"
        height="2.5"
        rx="1.25"
        fill="var(--border-default)"
      />
      <rect
        x="12"
        y="28"
        width="24"
        height="2.5"
        rx="1.25"
        fill="var(--border-strong)"
      />
      <rect
        x="12"
        y="35"
        width="14"
        height="2.5"
        rx="1.25"
        fill="var(--border-default)"
      />
    </svg>
  );
}

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="state-panel state-panel--empty">
      <div className="state-panel__icon">
        <SnippetIllustration />
      </div>
      <h2 className="state-panel__title">{title}</h2>
      <p className="state-panel__description">{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          className="button button--primary"
          onClick={onAction}
          style={{ marginTop: 4 }}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
