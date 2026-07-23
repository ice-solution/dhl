const fs = require('fs');
const path = require('path');

const UPLOAD_ROOT = path.join(__dirname, '..', 'public', 'uploads');
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png']);
const MAX_BYTES = 10 * 1024 * 1024;

function ensureUploadDir(userId) {
  const dir = path.join(UPLOAD_ROOT, String(userId));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getExtension(file) {
  const fromMime = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
  };
  if (fromMime[file.mimetype]) return fromMime[file.mimetype];

  const ext = path.extname(file.originalname || '').toLowerCase();
  if (ext === '.jpeg') return '.jpg';
  if (['.jpg', '.png'].includes(ext)) return ext;
  return '.jpg';
}

async function saveUserPhoto(userId, type, file) {
  if (!file?.buffer?.length) {
    throw new Error('No photo file received.');
  }
  if (!ALLOWED_MIME.has(file.mimetype)) {
    throw new Error('Photo must be JPEG or PNG format.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Photo file is too large (max 10MB).');
  }

  const userDir = ensureUploadDir(userId);
  const filename = `${type}-${Date.now()}${getExtension(file)}`;
  const filepath = path.join(userDir, filename);
  await fs.promises.writeFile(filepath, file.buffer);

  return `/uploads/${userId}/${filename}`;
}

function isStoredPhotoPath(value) {
  return typeof value === 'string' && value.startsWith('/uploads/');
}

async function deleteUserUploads(userId) {
  const dir = path.join(UPLOAD_ROOT, String(userId));
  await fs.promises.rm(dir, { recursive: true, force: true });
}

module.exports = {
  MAX_BYTES,
  saveUserPhoto,
  isStoredPhotoPath,
  deleteUserUploads,
};
