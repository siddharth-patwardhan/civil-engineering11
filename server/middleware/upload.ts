import fs from "node:fs";
import path from "node:path";
import multer from "multer";

const uploadDir = path.join(process.cwd(), "uploads", "drawings");
fs.mkdirSync(uploadDir, { recursive: true });

/**
 * Whitelist of allowed MIME types for drawing uploads.
 */
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

/**
 * Whitelist of allowed file extensions (defense in depth).
 */
const ALLOWED_EXTENSIONS = new Set([".pdf", ".png", ".jpg", ".jpeg", ".webp", ".dxf"]);

function getExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

/**
 * Enhanced multer configuration with file type validation.
 * Rejects uploads that don't match the whitelist.
 */
export const drawingUpload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (_req, file, cb) => {
    const ext = getExtension(file.originalname);
    const mime = file.mimetype;

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(
        new Error(
          `Invalid file extension: ${ext}. Allowed: ${Array.from(ALLOWED_EXTENSIONS).join(", ")}`
        )
      );
    }

    if (!ALLOWED_MIME_TYPES.has(mime)) {
      return cb(
        new Error(
          `Invalid file type: ${mime}. Allowed: ${Array.from(ALLOWED_MIME_TYPES).join(", ")}`
        )
      );
    }

    cb(null, true);
  },
});

/**
 * Single file upload handler with error wrapping for Express.
 */
export function uploadSingleDrawing(fieldName: string) {
  return (req: any, res: any, next: any) => {
    drawingUpload.single(fieldName)(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "File too large. Maximum 25MB." });
        }
        return res.status(400).json({ error: err.message });
      }
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  };
}
