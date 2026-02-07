import React, { useEffect, useMemo, useState } from "react";
import { LayoutGrid, List, Loader2, Plus } from "lucide-react";
import { useNotes } from "../../context/NoteContext";
import NoteCard from "../../components/Note/NoteCard";
import NoteForm from "../../components/Note/NoteForm";

// canManage: can edit/delete notes (admin/project_admin only)
// canCreate: can create notes (all project members including regular members)
const ProjectNotes = ({ projectId, canManage, canCreate = true }) => {
  const {
    notes,
    noteLoading,
    noteError,
    fetchNotes,
    addNote,
    editNote,
    removeNote,
    fetchNoteDetails,
    selectedNote,
    setSelectedNote,
  } = useNotes();

  const [view, setView] = useState("grid");
  const [search, setSearch] = useState("");
  const [modalState, setModalState] = useState({ open: false, mode: "create", note: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchNotes(projectId);
    }
  }, [projectId, fetchNotes]);

  useEffect(() => {
    return () => setSelectedNote(null);
  }, [setSelectedNote]);

  const filteredNotes = useMemo(() => {
    if (!search) return notes;
    const query = search.toLowerCase();
    return notes.filter(
      (note) =>
        note.title?.toLowerCase().includes(query) ||
        note.content?.toLowerCase().includes(query) ||
        note.createdBy?.username?.toLowerCase().includes(query) ||
        note.createdBy?.fullname?.toLowerCase().includes(query) ||
        note.createdBy?.email?.toLowerCase().includes(query)
    );
  }, [notes, search]);

  const closeModal = () => setModalState({ open: false, mode: "create", note: null });

  const handleCreate = async (payload) => {
    setIsSubmitting(true);
    const result = await addNote(projectId, payload);
    setIsSubmitting(false);
    if (result.success) {
      closeModal();
    }
  };

  const handleUpdate = async (payload) => {
    if (!modalState.note) return;
    const id = modalState.note.id || modalState.note._id;
    setIsSubmitting(true);
    const result = await editNote(projectId, id, payload);
    setIsSubmitting(false);
    if (result.success) {
      closeModal();
    }
  };

  const handleDelete = async (note) => {
    const confirmed = window.confirm(`Delete note "${note.title || "Untitled"}"?`);
    if (!confirmed) return;
    await removeNote(projectId, note.id || note._id);
    if (selectedNote && (selectedNote.id || selectedNote._id) === (note.id || note._id)) {
      setSelectedNote(null);
    }
  };

  const handleSelectNote = async (note) => {
    setSelectedNote(note);
    setDetailLoading(true);
    try {
      await fetchNoteDetails(projectId, note.id || note._id);
    } finally {
      setDetailLoading(false);
    }
  };

  const renderNotes = () => {
    if (noteLoading && notes.length === 0) {
      return (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      );
    }

    if (noteError) {
      return <div className="rounded-xl border border-error/30 bg-error/10 p-4 text-error text-sm">{noteError}</div>;
    }

    if (filteredNotes.length === 0) {
      return (
        <div className="text-center border border-dashed border-border rounded-2xl p-10">
          <p className="text-lg font-semibold text-foreground">No notes yet</p>
          <p className="text-sm text-muted-foreground mt-1">Capture your first note to document decisions.</p>
          {canCreate && (
            <button
              type="button"
              onClick={() => setModalState({ open: true, mode: "create", note: null })}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Plus size={16} /> Add Note
            </button>
          )}
        </div>
      );
    }

    if (view === "grid") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <NoteCard key={note.id || note._id} note={note} onClick={handleSelectNote} />
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {filteredNotes.map((note) => (
          <div
            key={note.id || note._id}
            className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : ""}
                </p>
                <h3 className="text-lg font-semibold text-foreground">{note.title || "Untitled Note"}</h3>
              </div>
              <button
                type="button"
                onClick={() => handleSelectNote(note)}
                className="text-sm text-primary font-medium"
              >
                View
              </button>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {note.content?.replace(/\n+/g, " ")}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Notes</h2>
          <p className="text-sm text-muted-foreground">
            Capture meeting minutes, decisions, and important context for this project.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-2xl border border-border px-3 py-2 bg-input">
            <span className="text-sm text-muted-foreground">Search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm focus:outline-none"
              placeholder="Find notes"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={`h-10 w-10 rounded-xl border flex items-center justify-center ${
                view === "grid" ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground"
              }`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={`h-10 w-10 rounded-xl border flex items-center justify-center ${
                view === "list" ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground"
              }`}
            >
              <List size={16} />
            </button>
            {canCreate && (
              <button
                type="button"
                onClick={() => setModalState({ open: true, mode: "create", note: null })}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                <Plus size={16} /> New Note
              </button>
            )}
          </div>
        </div>
      </header>

      {renderNotes()}

      {modalState.open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <NoteForm
              mode={modalState.mode}
              initialValues={modalState.note || undefined}
              onSubmit={modalState.mode === "edit" ? handleUpdate : handleCreate}
              onCancel={closeModal}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}

      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Project Note</p>
                <h3 className="text-2xl font-semibold text-foreground">
                  {selectedNote.title || selectedNote.content?.split("\n")[0] || "Untitled"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedNote.createdBy?.username || selectedNote.createdBy?.fullname || selectedNote.createdBy?.email || "Unknown"} ·
                  {" "}
                  {selectedNote.createdAt
                    ? new Date(selectedNote.createdAt).toLocaleString()
                    : "Unknown date"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {canManage && (
                  <button
                    type="button"
                    onClick={() => {
                      const noteToEdit = selectedNote;
                      setSelectedNote(null);
                      setModalState({ open: true, mode: "edit", note: noteToEdit });
                    }}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground"
                  >
                    Edit
                  </button>
                )}
                {canManage && (
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedNote)}
                    className="rounded-lg border border-error px-3 py-1.5 text-sm text-error"
                  >
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedNote(null)}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground"
                >
                  Close
                </button>
              </div>
            </div>

            {detailLoading ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <div className="prose prose-sm max-w-none text-foreground">
                {selectedNote.content?.split("\n").map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default ProjectNotes;
