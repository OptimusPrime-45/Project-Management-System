import React, { useState, useEffect, useCallback } from "react";
import { Upload, FileText, Loader2, RefreshCw, Search } from "lucide-react";
import toast from "react-hot-toast";
import DocumentCard from "../../components/Document/DocumentCard";
import DocumentForm from "../../components/Document/DocumentForm";
import { EmptyState } from "../../components/Common/EmptyState";
import {
    getDocuments,
    uploadDocument,
    updateDocument,
    deleteDocument,
    downloadDocument,
} from "../../api/documents";

const ProjectDocuments = ({ projectId, canManage }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [modalState, setModalState] = useState({
        open: false,
        mode: "create",
        document: null,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchDocuments = useCallback(async () => {
        if (!projectId) return;
        
        setLoading(true);
        setError(null);
        try {
            const response = await getDocuments(projectId);
            setDocuments(response.data?.documents || []);
        } catch (err) {
            console.error("Error fetching documents:", err);
            setError(err.response?.data?.message || "Failed to load documents");
            toast.error("Failed to load documents");
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const handleUpload = async (formData) => {
        setIsSubmitting(true);
        try {
            await uploadDocument(projectId, formData);
            toast.success("Document uploaded successfully");
            setModalState({ open: false, mode: "create", document: null });
            fetchDocuments();
        } catch (err) {
            console.error("Error uploading document:", err);
            toast.error(err.response?.data?.message || "Failed to upload document");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async (formData) => {
        if (!modalState.document) return;
        
        setIsSubmitting(true);
        try {
            await updateDocument(projectId, modalState.document._id, {
                name: formData.get("name"),
                description: formData.get("description"),
            });
            toast.success("Document updated successfully");
            setModalState({ open: false, mode: "create", document: null });
            fetchDocuments();
        } catch (err) {
            console.error("Error updating document:", err);
            toast.error(err.response?.data?.message || "Failed to update document");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (document) => {
        const confirmed = window.confirm(
            `Delete "${document.name}"? This cannot be undone.`
        );
        if (!confirmed) return;

        try {
            await deleteDocument(projectId, document._id);
            toast.success("Document deleted successfully");
            fetchDocuments();
        } catch (err) {
            console.error("Error deleting document:", err);
            toast.error(err.response?.data?.message || "Failed to delete document");
        }
    };

    const handleView = (document) => {
        window.open(document.fileUrl, "_blank");
    };

    const handleDownload = (document) => {
        downloadDocument(document.fileUrl, document.originalName);
    };

    const handleEdit = (document) => {
        setModalState({ open: true, mode: "edit", document });
    };

    const filteredDocuments = documents.filter(
        (doc) =>
            doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading && documents.length === 0) {
        return (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading documents…
            </div>
        );
    }

    if (error && documents.length === 0) {
        return (
            <div className="rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error">
                {error}
            </div>
        );
    }

    return (
        <section className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-foreground">
                        Documents
                    </h2>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {documents.length}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                            type="text"
                            placeholder="Search documents..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-9 w-48 rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>

                    {/* Refresh */}
                    <button
                        type="button"
                        onClick={fetchDocuments}
                        disabled={loading}
                        className="inline-flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    </button>

                    {/* Upload Button - all project members can upload */}
                    <button
                        type="button"
                        onClick={() => setModalState({ open: true, mode: "create", document: null })}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                        <Upload size={16} /> Upload
                    </button>
                </div>
            </div>

            {/* Document List */}
            {filteredDocuments.length === 0 ? (
                documents.length === 0 ? (
                    <EmptyState
                        icon={FileText}
                        title="No documents yet"
                        description="Upload documents related to this project for easy access and collaboration."
                        action={{
                            label: "Upload Document",
                            onClick: () => setModalState({ open: true, mode: "create", document: null }),
                        }}
                    />
                ) : (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No documents match your search.</p>
                    </div>
                )
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredDocuments.map((doc) => (
                        <DocumentCard
                            key={doc._id}
                            document={doc}
                            onView={handleView}
                            onDownload={handleDownload}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            canManage={canManage}
                        />
                    ))}
                </div>
            )}

            {/* Upload/Edit Modal */}
            {modalState.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
                        <DocumentForm
                            onSubmit={modalState.mode === "edit" ? handleUpdate : handleUpload}
                            onCancel={() => setModalState({ open: false, mode: "create", document: null })}
                            isSubmitting={isSubmitting}
                            initialValues={modalState.mode === "edit" ? modalState.document : null}
                        />
                    </div>
                </div>
            )}
        </section>
    );
};

export default ProjectDocuments;
