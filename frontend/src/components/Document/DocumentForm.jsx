import React, { useState, useRef } from "react";
import { Upload, X, FileText, Loader2 } from "lucide-react";

const DocumentForm = ({ onSubmit, onCancel, isSubmitting, initialValues = null }) => {
    const mode = initialValues ? "edit" : "create";
    const [name, setName] = useState(initialValues?.name || "");
    const [description, setDescription] = useState(initialValues?.description || "");
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (selectedFile) => {
        setFile(selectedFile);
        if (!name) {
            setName(selectedFile.name);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (mode === "create" && !file) {
            return;
        }

        const formData = new FormData();
        if (file) {
            formData.append("file", file);
        }
        formData.append("name", name);
        formData.append("description", description);

        await onSubmit(formData, mode);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">
                    {mode === "edit" ? "Edit Document" : "Upload Document"}
                </h2>
                <button
                    type="button"
                    onClick={onCancel}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                    <X size={20} />
                </button>
            </div>

            {/* File Upload Area - only show in create mode */}
            {mode === "create" && (
                <div
                    className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                        dragActive
                            ? "border-primary bg-primary/5"
                            : file
                            ? "border-success bg-success/5"
                            : "border-border hover:border-primary/50"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileInput}
                        accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z"
                    />

                    {file ? (
                        <div className="space-y-2">
                            <FileText size={40} className="mx-auto text-success" />
                            <p className="font-medium text-foreground">{file.name}</p>
                            <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                            <button
                                type="button"
                                onClick={() => {
                                    setFile(null);
                                    if (fileInputRef.current) {
                                        fileInputRef.current.value = "";
                                    }
                                }}
                                className="text-sm text-error hover:underline"
                            >
                                Remove file
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Upload size={40} className="mx-auto text-muted-foreground" />
                            <div>
                                <p className="text-foreground">
                                    Drag and drop your file here, or{" "}
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-primary hover:underline font-medium"
                                    >
                                        browse
                                    </button>
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Max file size: 10MB
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Supported: Images, PDF, Word, Excel, PowerPoint, Text, CSV, ZIP, RAR
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Name Field */}
            <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                    Document Name
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter document name"
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                />
            </div>

            {/* Description Field */}
            <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                    Description <span className="text-muted-foreground">(optional)</span>
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description for this document"
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50"
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || (mode === "create" && !file)}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            {mode === "edit" ? "Saving..." : "Uploading..."}
                        </>
                    ) : mode === "edit" ? (
                        "Save Changes"
                    ) : (
                        <>
                            <Upload size={16} />
                            Upload Document
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default DocumentForm;
