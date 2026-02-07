import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, `./public/images`);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

// Image upload for avatars (small files, images only)
export const upload = multer({
    storage,
    limits: {
        fileSize: 1 * 1024 * 1024, // 1 MB
    },
    fileFilter: function (req, file, cb) {
        if (
            file.mimetype === "image/png" ||
            file.mimetype === "image/jpg" ||
            file.mimetype === "image/jpeg"
        ) {
            cb(null, true);
        } else {
            cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
        }
    },
});

// Document upload for project files (larger files, more types)
const allowedDocumentTypes = [
    // Images
    "image/png",
    "image/jpg",
    "image/jpeg",
    "image/gif",
    "image/webp",
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    // Text
    "text/plain",
    "text/csv",
    // Archives
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
];

export const documentUpload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB max for documents
    },
    fileFilter: function (req, file, cb) {
        if (allowedDocumentTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("File type not supported. Allowed types: images, PDF, Word, Excel, PowerPoint, text, CSV, ZIP, RAR, 7z"));
        }
    },
});
