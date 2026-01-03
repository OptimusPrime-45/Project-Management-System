import React from "react";
import { FileText, Clock3, User, Bookmark } from "lucide-react";

const NoteCard = ({ note, onClick }) => {
  if (!note) return null;

  const title =
    note.title?.trim() ||
    note.content?.split("\n")[0]?.slice(0, 80) ||
    "Untitled Note";
  const preview =
    note.content?.replace(/\n+/g, " ").slice(0, 140) || "No content";
  const author =
    note.createdBy?.username ||
    note.createdBy?.fullname ||
    note.createdBy?.email ||
    note.author ||
    "Unknown";
  const created = note.createdAt
    ? new Date(note.createdAt).toLocaleDateString()
    : "Unknown";
  const wordCount = note.content ? note.content.split(/\s+/).length : 0;

  return (
    <button
      type="button"
      onClick={() => onClick?.(note)}
      className="w-full text-left bg-card border border-card-border rounded-xl p-5 shadow-sm hover:shadow-lg transition-all card-hover group relative overflow-hidden"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText size={16} className="text-primary" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Note
            </span>
          </div>
          <Bookmark
            size={14}
            className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>

        <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-4">
          {preview}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 bg-muted px-2.5 py-1.5 rounded-md">
              <User size={12} />
              <span className="font-medium">{author}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 size={12} />
              <span>{created}</span>
            </span>
          </div>
          {wordCount > 0 && (
            <span className="text-xs text-muted-foreground font-medium">
              {wordCount} words
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default NoteCard;
