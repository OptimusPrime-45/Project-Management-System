import React from "react";
import {
    FileText,
    Image,
    FileSpreadsheet,
    Presentation,
    FileArchive,
    File,
    Download,
    Trash2,
    ExternalLink,
    Pencil,
} from "lucide-react";

// Get icon based on file type
const getFileIcon = (fileType) => {
    switch (fileType) {
        case "image":
            return Image;
        case "pdf":
        case "word":
        case "text":
            return FileText;
        case "excel":
            return FileSpreadsheet;
        case "powerpoint":
            return Presentation;
        case "archive":
            return FileArchive;
        default:
            return File;
    }
};

// Get color based on file type
const getFileColor = (fileType) => {
    switch (fileType) {
        case "image":
            return "text-purple-500";
        case "pdf":
            return "text-red-500";
        case "word":
            return "text-blue-500";
        case "excel":
            return "text-green-500";
        case "powerpoint":
            return "text-orange-500";
        case "archive":
            return "text-yellow-500";
        default:
            return "text-muted-foreground";
    }
};

// Format file size
const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Format date
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

const DocumentCard = ({ document, onView, onDownload, onEdit, onDelete, canManage }) => {
    const FileIcon = getFileIcon(document.fileType);
    const iconColor = getFileColor(document.fileType);

    return (
        <div className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md">
            <div className="flex items-start gap-4">
                {/* File Icon */}
                <div className={`rounded-lg bg-muted/50 p-3 ${iconColor}`}>
                    <FileIcon size={24} />
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate" title={document.name}>
                        {document.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                        {formatFileSize(document.fileSize)} • {formatDate(document.createdAt)}
                    </p>
                    {document.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {document.description}
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                        Uploaded by {document.uploadedBy?.username || "Unknown"}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        type="button"
                        onClick={() => onView(document)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        title="View"
                    >
                        <ExternalLink size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onDownload(document)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                        title="Download"
                    >
                        <Download size={16} />
                    </button>
                    {canManage && (
                        <>
                            <button
                                type="button"
                                onClick={() => onEdit(document)}
                                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                title="Edit"
                            >
                                <Pencil size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => onDelete(document)}
                                className="p-2 rounded-lg text-muted-foreground hover:text-error hover:bg-error/10"
                                title="Delete"
                            >
                                <Trash2 size={16} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Image Preview for image files */}
            {document.fileType === "image" && (
                <div className="mt-4 rounded-lg overflow-hidden bg-muted/30">
                    <img
                        src={document.fileUrl}
                        alt={document.name}
                        className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => onView(document)}
                    />
                </div>
            )}
        </div>
    );
};

export default DocumentCard;
