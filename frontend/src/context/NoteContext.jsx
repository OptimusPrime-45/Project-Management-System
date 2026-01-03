import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
} from "../api/notes";

const NoteContext = createContext(null);

export const useNotes = () => {
  const context = useContext(NoteContext);
  if (!context) {
    throw new Error("useNotes must be used within a NoteProvider");
  }
  return context;
};

export const NoteProvider = ({ children }) => {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteError, setNoteError] = useState(null);

  const fetchNotes = useCallback(async (projectId) => {
    if (!projectId) return;
    setNoteLoading(true);
    setNoteError(null);
    try {
      const payload = await getAllNotes(projectId);
      const normalized = Array.isArray(payload?.notes)
        ? payload.notes
        : Array.isArray(payload)
        ? payload
        : [];
      setNotes(normalized);
    } catch (error) {
      setNoteError(error.response?.data?.message || "Failed to fetch notes");
      setNotes([]);
    } finally {
      setNoteLoading(false);
    }
  }, []);

  const fetchNoteDetails = useCallback(async (projectId, noteId) => {
    if (!projectId || !noteId) return;
    setNoteLoading(true);
    setNoteError(null);
    try {
      const payload = await getNoteById(projectId, noteId);
      const noteData = payload?.note ?? payload ?? null;
      if (noteData) {
        setSelectedNote(noteData);
      }
      return { success: true, note: noteData };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to fetch note";
      setNoteError(message);
      return { success: false, message };
    } finally {
      setNoteLoading(false);
    }
  }, []);

  const handleNoteMutation = useCallback(
    async (mutationFn, projectId, ...args) => {
      if (!projectId) {
        return { success: false, message: "Project ID is required" };
      }
      setNoteLoading(true);
      setNoteError(null);
      try {
        const result = await mutationFn(projectId, ...args);
        await fetchNotes(projectId);
        return { success: true, result };
      } catch (error) {
        const message = error.response?.data?.message || "Note operation failed";
        setNoteError(message);
        return { success: false, message };
      } finally {
        setNoteLoading(false);
      }
    },
    [fetchNotes]
  );

  const addNote = useCallback((projectId, payload) => handleNoteMutation(createNote, projectId, payload), [handleNoteMutation]);

  const editNote = useCallback(
    (projectId, noteId, payload) => handleNoteMutation(updateNote, projectId, noteId, payload),
    [handleNoteMutation]
  );

  const removeNote = useCallback(
    (projectId, noteId) => handleNoteMutation(deleteNote, projectId, noteId),
    [handleNoteMutation]
  );

  const value = useMemo(() => ({
    notes,
    selectedNote,
    noteLoading,
    noteError,
    fetchNotes,
    fetchNoteDetails,
    addNote,
    editNote,
    removeNote,
    setSelectedNote,
  }), [
    notes,
    selectedNote,
    noteLoading,
    noteError,
    fetchNotes,
    fetchNoteDetails,
    addNote,
    editNote,
    removeNote,
  ]);

  return <NoteContext.Provider value={value}>{children}</NoteContext.Provider>;
};
