import multer from 'multer';

const storage = multer.memoryStorage();

export const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    fileFilter: (_req, file, cb) => {
        const allowed = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'application/pdf',
            'video/mp4',
            'video/webm',
        ];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file type: ${file.mimetype}`));
        }
    },
});
