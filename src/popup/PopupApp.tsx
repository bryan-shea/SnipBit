import { useState } from "react";
import brandIcon from "../assets/icon-32.png";
import { EmptyState } from "../components/EmptyState";
import { SearchInput } from "../components/SearchInput";
import { SnippetCard } from "../components/SnippetCard";
import { Toast } from "../components/Toast";
import { ExternalLinkIcon } from "../components/ui/icons";
import { useCollections } from "../hooks/useCollections";
import { useSnippetFilters } from "../hooks/useSnippetFilters";
import type { FilterView } from "../hooks/useSnippetFilters";
import { useSnippets } from "../hooks/useSnippets";
import { useToast } from "../hooks/useToast";
import { copyText } from "../services/clipboard";
import { openManagerSurface } from "../services/chromeRuntime";
import type { Snippet } from "../types/snippet";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}

export function PopupApp() {
  const { snippets, loading, error, refresh } = useSnippets();
  const { collections } = useCollections();
  const { toast, showToast, clearToast } = useToast();
  const [searchValue, setSearchValue] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterView>("all");

  const { filtered: visibleSnippets, countByFilter } = useSnippetFilters(
    snippets,
    collections,
    searchValue,
    activeFilter,
  );

  async function handleCopy(snippet: Snippet) {
    try {
      await copyText(snippet.body);
      showToast(`Copied "${snippet.title}" to clipboard.`);
    } catch (copyError) {
      showToast(getErrorMessage(copyError), "error");
    }
  }

  async function handleOpenLibrary() {
    try {
      await openManagerSurface();
    } catch (openError) {
      showToast(getErrorMessage(openError), "error");
    }
  }

  const snippetCount =
    visibleSnippets.length === snippets.length
      ? `${snippets.length} snippet${snippets.length === 1 ? "" : "s"}`
      : `${visibleSnippets.length} of ${snippets.length} snippets`;

  // Show filter chips: All, Favorites, Unassigned, then each collection.
  type ChipDef = { id: FilterView; label: string; count: number };

  const filterChips: ChipDef[] = [
    { id: "all", label: "All", count: countByFilter["all"] ?? 0 },
    {
      id: "favorites",
      label: "Favorites",
      count: countByFilter["favorites"] ?? 0,
    },
    ...(countByFilter["unassigned"] !== undefined &&
    countByFilter["unassigned"] > 0
      ? [
          {
            id: "unassigned" as FilterView,
            label: "Unassigned",
            count: countByFilter["unassigned"],
          },
        ]
      : []),
    ...collections.map((c) => ({
      id: c.id as FilterView,
      label: c.name,
      count: countByFilter[c.id] ?? 0,
    })),
  ];

  const hasActiveFilter = activeFilter !== "all";

  return (
    <div className="app-shell app-shell--popup">
      {/* Header */}
      <header className="hero">
        <div className="brand">
          <img src={brandIcon} alt="SnipBit" className="brand__mark" />
          <div className="brand__name">
            <p className="brand__eyebrow">Quick access</p>
            <h1 className="brand__title">SnipBit</h1>
          </div>
        </div>
        <button
          type="button"
          className="button button--ghost button--sm"
          onClick={() => void handleOpenLibrary()}
        >
          <ExternalLinkIcon size={12} />
          Library
        </button>
      </header>

      {/* Content */}
      <div className="surface">
        <div className="surface__toolbar">
          <SearchInput
            id="popup-search"
            value={searchValue}
            placeholder="Search snippets, tags…"
            onChange={setSearchValue}
          />
          {filterChips.length > 1 ? (
            <div
              className="chip-group"
              role="group"
              aria-label="Filter snippets"
            >
              {filterChips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  className={`chip-button${activeFilter === chip.id ? " chip-button--active" : ""}`}
                  onClick={() => setActiveFilter(chip.id)}
                >
                  {chip.label}
                  {chip.count > 0 ? (
                    <span
                      style={{
                        marginLeft: 4,
                        opacity: 0.7,
                        fontSize: "10px",
                      }}
                    >
                      {chip.count}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
          {snippets.length > 0 ? (
            <p className="surface__count">{snippetCount}</p>
          ) : null}
        </div>

        <div className="surface__list">
          {loading ? (
            <div className="loading-row">
              <span className="loading-row__dots">
                <span className="loading-row__dot" />
                <span className="loading-row__dot" />
                <span className="loading-row__dot" />
              </span>
              <span>Loading…</span>
            </div>
          ) : null}

          {!loading && error ? (
            <div
              className="state-panel state-panel--error"
              style={{ margin: "4px 0" }}
            >
              <p className="state-panel__title">Unable to load snippets</p>
              <p className="state-panel__description">{error}</p>
              <button
                type="button"
                className="button button--primary button--sm"
                onClick={() => void refresh()}
              >
                Retry
              </button>
            </div>
          ) : null}

          {!loading && !error && visibleSnippets.length > 0 ? (
            <div className="snippet-list">
              {visibleSnippets.map((snippet) => (
                <SnippetCard
                  key={snippet.id}
                  snippet={snippet}
                  onCopy={handleCopy}
                />
              ))}
            </div>
          ) : null}

          {!loading && !error && visibleSnippets.length === 0 ? (
            <EmptyState
              title={
                searchValue || hasActiveFilter
                  ? "No snippets match this filter"
                  : "Create your first snippet"
              }
              description={
                searchValue || hasActiveFilter
                  ? "Try a different search or filter."
                  : "Open the full library to add snippets, or highlight text on any page and save it via the right-click menu."
              }
              actionLabel={
                searchValue || hasActiveFilter
                  ? "Clear filters"
                  : "Open library"
              }
              onAction={
                searchValue || hasActiveFilter
                  ? () => {
                      setSearchValue("");
                      setActiveFilter("all");
                    }
                  : () => void handleOpenLibrary()
              }
            />
          ) : null}
        </div>
      </div>

      <Toast toast={toast} onDismiss={clearToast} />
    </div>
  );
}
