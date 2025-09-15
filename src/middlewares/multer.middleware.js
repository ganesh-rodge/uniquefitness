import multer from 'multer'

// Use memory storage to avoid writing to disk on ephemeral file systems
const storage = multer.memoryStorage();

// Export the multer instance with the new storage configuration
export const upload = multer({
    storage,
});