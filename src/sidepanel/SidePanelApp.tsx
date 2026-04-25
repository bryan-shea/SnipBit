import { useState } from "react";
import brandIcon from "../assets/icon-32.png";
import { CollectionDialog } from "../components/CollectionDialog";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { SearchInput } from "../components/SearchInput";
import { SnippetCard } from "../components/SnippetCard";
import { SnippetForm } from "../components/SnippetForm";
import { Toast } from "../components/Toast";
import {
  InboxIcon,
  LayoutGridIcon,
  PencilIcon,
  PlusIcon,
  StarOutlineIcon,
  TrashIcon,
} from "../components/ui/icons";
import { useCollections } from "../hooks/useCollections";
import { useSnippetFilters } from "../hooks/useSnippetFilters";
import type { FilterView } from "../hooks/useSnippetFilters";
import { useSnippets } from "../hooks/useSnippets";
import { useToast } from "../hooks/useToast";
import { copyText } from "../services/clipboard";
import type {
  Collection,
  CollectionDraft,
  CollectionUpdate,
} from "../types/collection";
import type { Snippet, SnippetDraft } from "../types/snippet";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}

function CollectionDot({ color }: { color?: string }) {
  return (
    <span
      className="collection-dot"
      style={{ background: color ?? "#6366f1" }}
      aria-hidden
    />
  );
}

type NavItemProps = {
  icon: React.ReactNode;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
};

function NavItem({ icon, label, count, active, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      className={`collection-nav__item${active ? " collection-nav__item--active" : ""}`}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
    >
      <span className="collection-nav__item-icon">{icon}</span>
      <span className="collection-nav__item-label">{label}</span>
      <span className="collection-nav__count">{count}</span>
    </button>
  );
}

export function SidePanelApp() {
  const {
    snippets,
    loading: snippetsLoading,
    error: snippetsError,
    refresh,
    createSnippet,
    updateSnippet,
    deleteSnippet,
    duplicateSnippet,
    toggleFavorite,
  } = useSnippets();

  const { collections, createCollection, updateCollection, deleteCollection } =
    useCollections();

  const { toast, showToast, clearToast } = useToast(2800);

  const [activeFilter, setActiveFilter] = useState<FilterView>("all");
  const [searchValue, setSearchValue] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [pendingDeleteSnippet, setPendingDeleteSnippet] =
    useState<Snippet | null>(null);
  const [formVersion, setFormVersion] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(
    null,
  );
  const [pendingDeleteCollection, setPendingDeleteCollection] =
    useState<Collection | null>(null);

  const { filtered: visibleSnippets, countByFilter } = useSnippetFilters(
    snippets,
    collections,
    searchValue,
    activeFilter,
  );

  function resetForm() {
    setEditingSnippet(null);
    setShowForm(false);
    setFormVersion((v) => v + 1);
  }

  function handleNewSnippetClick() {
    if (showForm && editingSnippet === null) {
      setShowForm(false);
    } else {
      setEditingSnippet(null);
      setShowForm(true);
    }
  }

  async function handleSubmit(input: SnippetDraft) {
    setIsSaving(true);

    try {
      if (editingSnippet) {
        await updateSnippet(editingSnippet.id, input);
        showToast(`Updated "${editingSnippet.title}".`);
      } else {
        await createSnippet(input);
        showToast(`Saved "${input.title.trim() || "New snippet"}".`);
      }

      resetForm();
    } catch (submitError) {
      showToast(getErrorMessage(submitError), "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCopy(snippet: Snippet) {
    try {
      await copyText(snippet.body);
      showToast(`Copied "${snippet.title}" to the clipboard.`);
    } catch (copyError) {
      showToast(getErrorMessage(copyError), "error");
    }
  }

  async function handleDuplicate(snippet: Snippet) {
    try {
      await duplicateSnippet(snippet.id);
      showToast(`Duplicated "${snippet.title}".`);
    } catch (duplicateError) {
      showToast(getErrorMessage(duplicateError), "error");
    }
  }

  async function handleToggleFavorite(snippet: Snippet) {
    try {
      await toggleFavorite(snippet.id);
      showToast(
        snippet.favorite
          ? `Removed "${snippet.title}" from favorites.`
          : `Favorited "${snippet.title}".`,
      );
    } catch (favoriteError) {
      showToast(getErrorMessage(favoriteError), "error");
    }
  }

  async function handleConfirmDeleteSnippet() {
    if (!pendingDeleteSnippet) {
      return;
    }

    try {
      await deleteSnippet(pendingDeleteSnippet.id);
      showToast(`Deleted "${pendingDeleteSnippet.title}".`);

      if (editingSnippet?.id === pendingDeleteSnippet.id) {
        resetForm();
      }
    } catch (deleteError) {
      showToast(getErrorMessage(deleteError), "error");
    } finally {
      setPendingDeleteSnippet(null);
    }
  }

  async function handleConfirmDeleteCollection() {
    if (!pendingDeleteCollection) {
      return;
    }

    try {
      await deleteCollection(pendingDeleteCollection.id);
      showToast(
        `Deleted "${pendingDeleteCollection.name}". Snippets moved to Unassigned.`,
      );

      if (activeFilter === pendingDeleteCollection.id) {
        setActiveFilter("all");
      }
    } catch (deleteError) {
      showToast(getErrorMessage(deleteError), "error");
    } finally {
      setPendingDeleteCollection(null);
    }
  }

  async function handleSaveCollection(draft: CollectionDraft) {
    if (editingCollection) {
      await updateCollection(editingCollection.id, draft as CollectionUpdate);
      showToast(`Updated collection "${draft.name}".`);
    } else {
      await createCollection(draft);
      showToast(`Created collection "${draft.name}".`);
    }
  }

  const defaultCollectionId: string | null =
    activeFilter !== "all" &&
    activeFilter !== "favorites" &&
    activeFilter !== "unassigned"
      ? String(activeFilter)
      : null;

  const activeFilterLabel =
    activeFilter === "all"
      ? "All snippets"
      : activeFilter === "favorites"
        ? "Favorites"
        : activeFilter === "unassigned"
          ? "Unassigned"
          : (collections.find((c) => c.id === activeFilter)?.name ??
            "Collection");

  const showCollectionBadge =
    activeFilter === "all" || activeFilter === "favorites";

  const isCreatingNew = showForm && editingSnippet === null;

  const listEmptyMessage =
    searchValue || activeFilter !== "all"
      ? {
          title: "No snippets match the current filters",
          description: "Adjust the search query or select a different filter.",
          actionLabel: "Show all snippets",
          onAction: () => {
            setSearchValue("");
            setActiveFilter("all");
          },
        }
      : {
          title: "Start building your snippet library",
          description:
            "Create a snippet above or capture highlighted text from any webpage via the right-click menu.",
          actionLabel: "Create first snippet",
          onAction: () => {
            setShowForm(true);
          },
        };

  return (
    <div className="app-shell app-shell--sidepanel">
      {/* Header */}
      <header className="hero">
        <div className="brand">
          <img src={brandIcon} alt="SnipBit" className="brand__mark" />
          <div className="brand__name">
            <p className="brand__eyebrow">Snippet library</p>
            <h1 className="brand__title">SnipBit</h1>
          </div>
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className="sidepanel-body-layout">
        {/* Collection sidebar */}
        <nav className="collection-nav" aria-label="Collections">
          <div className="collection-nav__section">
            <NavItem
              icon={<LayoutGridIcon size={13} />}
              label="All snippets"
              count={countByFilter["all"] ?? 0}
              active={activeFilter === "all"}
              onClick={() => {
                setActiveFilter("all");
              }}
            />
            <NavItem
              icon={<StarOutlineIcon size={13} />}
              label="Favorites"
              count={countByFilter["favorites"] ?? 0}
              active={activeFilter === "favorites"}
              onClick={() => {
                setActiveFilter("favorites");
              }}
            />
            <NavItem
              icon={<InboxIcon size={13} />}
              label="Unassigned"
              count={countByFilter["unassigned"] ?? 0}
              active={activeFilter === "unassigned"}
              onClick={() => {
                setActiveFilter("unassigned");
              }}
            />
          </div>

          {collections.length > 0 ? (
            <>
              <div className="collection-nav__divider" />
              <div className="collection-nav__section">
                <span className="collection-nav__section-label">
                  Collections
                </span>
                {collections.map((collection) => (
                  <div
                    key={collection.id}
                    className={`collection-nav__row${activeFilter === collection.id ? " collection-nav__row--active" : ""}`}
                  >
                    <button
                      type="button"
                      className="collection-nav__row-btn"
                      onClick={() => {
                        setActiveFilter(collection.id);
                      }}
                      aria-current={
                        activeFilter === collection.id ? "page" : undefined
                      }
                    >
                      <CollectionDot color={collection.color ?? "#6366f1"} />
                      <span className="collection-nav__item-label">
                        {collection.name}
                      </span>
                      <span className="collection-nav__count">
                        {countByFilter[collection.id] ?? 0}
                      </span>
                    </button>
                    <div className="collection-nav__row-actions">
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Edit collection "${collection.name}"`}
                        onClick={() => {
                          setEditingCollection(collection);
                          setCollectionDialogOpen(true);
                        }}
                      >
                        <PencilIcon size={11} />
                      </button>
                      <button
                        type="button"
                        className="icon-button icon-button--danger"
                        aria-label={`Delete collection "${collection.name}"`}
                        onClick={() => {
                          setPendingDeleteCollection(collection);
                        }}
                      >
                        <TrashIcon size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          <div className="collection-nav__footer">
            <button
              type="button"
              className="button button--ghost button--sm"
              style={{ width: "100%" }}
              onClick={() => {
                setEditingCollection(null);
                setCollectionDialogOpen(true);
              }}
            >
              <PlusIcon size={12} />
              New collection
            </button>
          </div>
        </nav>

        {/* Main content */}
        <div className="sidepanel-content">
          {/* Toolbar */}
          <div className="content-toolbar">
            <div className="content-toolbar__top">
              <SearchInput
                id="sidepanel-search"
                value={searchValue}
                placeholder="Search snippets…"
                onChange={setSearchValue}
              />
              <button
                type="button"
                className={`button button--sm${isCreatingNew ? " button--outline" : " button--primary"}`}
                style={{ flexShrink: 0 }}
                onClick={handleNewSnippetClick}
              >
                {isCreatingNew ? "Cancel" : "+ New"}
              </button>
            </div>
            <div className="content-toolbar__row">
              <span className="content-heading">{activeFilterLabel}</span>
              <span className="surface__count">
                {visibleSnippets.length !== snippets.length
                  ? `${visibleSnippets.length} of ${snippets.length}`
                  : `${snippets.length} snippet${snippets.length !== 1 ? "s" : ""}`}
              </span>
            </div>
          </div>

          {/* Snippet create/edit form */}
          {showForm ? (
            <div className="form-panel">
              <SnippetForm
                key={editingSnippet?.id ?? `new-${formVersion}`}
                initialSnippet={editingSnippet}
                isSaving={isSaving}
                collections={collections}
                defaultCollectionId={
                  editingSnippet ? undefined : defaultCollectionId
                }
                onSubmit={handleSubmit}
                onCancel={resetForm}
              />
            </div>
          ) : null}

          {/* Snippet list */}
          <div className="snippet-list-area">
            {snippetsLoading ? (
              <div className="loading-row">
                <span className="loading-row__dots">
                  <span className="loading-row__dot" />
                  <span className="loading-row__dot" />
                  <span className="loading-row__dot" />
                </span>
                <span>Loading…</span>
              </div>
            ) : null}

            {!snippetsLoading && snippetsError ? (
              <div className="state-panel state-panel--error">
                <p className="state-panel__title">Unable to load snippets</p>
                <p className="state-panel__description">{snippetsError}</p>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => {
                    void refresh();
                  }}
                >
                  Retry
                </button>
              </div>
            ) : null}

            {!snippetsLoading &&
            !snippetsError &&
            visibleSnippets.length > 0 ? (
              <div className="snippet-list snippet-list--manager">
                {visibleSnippets.map((snippet) => {
                  const collection =
                    showCollectionBadge && snippet.collectionId
                      ? collections.find((c) => c.id === snippet.collectionId)
                      : null;

                  return (
                    <SnippetCard
                      key={snippet.id}
                      snippet={snippet}
                      variant="manager"
                      collectionName={collection?.name}
                      collectionColor={collection?.color}
                      onCopy={handleCopy}
                      onEdit={(nextSnippet) => {
                        setEditingSnippet(nextSnippet);
                        setShowForm(true);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      onDuplicate={handleDuplicate}
                      onDelete={(nextSnippet) => {
                        setPendingDeleteSnippet(nextSnippet);
                      }}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  );
                })}
              </div>
            ) : null}

            {!snippetsLoading &&
            !snippetsError &&
            visibleSnippets.length === 0 ? (
              <EmptyState {...listEmptyMessage} />
            ) : null}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CollectionDialog
        open={collectionDialogOpen}
        existingCollection={editingCollection}
        existingNames={collections.map((c) => c.name)}
        onConfirm={(draft) => handleSaveCollection(draft)}
        onClose={() => {
          setCollectionDialogOpen(false);
          setEditingCollection(null);
        }}
      />

      <ConfirmDialog
        open={pendingDeleteSnippet !== null}
        title={
          pendingDeleteSnippet
            ? `Delete "${pendingDeleteSnippet.title}"?`
            : "Delete snippet?"
        }
        description="This removes the snippet from local storage and cannot be undone."
        confirmLabel="Delete snippet"
        onConfirm={() => {
          void handleConfirmDeleteSnippet();
        }}
        onCancel={() => {
          setPendingDeleteSnippet(null);
        }}
      />

      <ConfirmDialog
        open={pendingDeleteCollection !== null}
        title={
          pendingDeleteCollection
            ? `Delete "${pendingDeleteCollection.name}"?`
            : "Delete collection?"
        }
        description="Snippets in this collection will be kept and moved to Unassigned."
        confirmLabel="Delete collection"
        onConfirm={() => {
          void handleConfirmDeleteCollection();
        }}
        onCancel={() => {
          setPendingDeleteCollection(null);
        }}
      />

      <Toast toast={toast} onDismiss={clearToast} />
    </div>
  );
}
