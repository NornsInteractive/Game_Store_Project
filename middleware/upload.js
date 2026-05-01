const multer = require('multer');

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

function fileFilter(req, file, cb) {
  if (allowedMimeTypes.has(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new Error('Only JPEG, PNG, and WebP images are allowed.'));
}

function createUploader(fileSize) {
  return multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize }
  });
}

function fileToDataUrl(file) {
  if (!file || !file.buffer) {
    return null;
  }

  return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
}

const uploadGameCover = createUploader(5 * 1024 * 1024);
const uploadAvatar = createUploader(2 * 1024 * 1024);
const uploadThumbnail = createUploader(5 * 1024 * 1024);
const uploadHero = createUploader(5 * 1024 * 1024);

module.exports = {
  fileToDataUrl,
  uploadAvatar,
  uploadGameCover,
  uploadHero,
  uploadThumbnail
};
