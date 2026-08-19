const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure root uploads folder exists
const rootUploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(rootUploadDir)) {
  fs.mkdirSync(rootUploadDir, { recursive: true });
}

// Storage Configuration with Subfolders (/uploads/ProfileImg, /uploads/IdProof, /uploads/Cheque)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subFolder = 'ProfileImg';
    if (file.fieldname === 'idProofImage') {
      subFolder = 'IdProof';
    } else if (file.fieldname === 'chequeImage') {
      subFolder = 'Cheque';
    }

    const folderPath = path.join(rootUploadDir, subFolder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    let prefix = 'profile';
    if (file.fieldname === 'idProofImage') prefix = 'id';
    if (file.fieldname === 'chequeImage') prefix = 'cheque';
    cb(null, `${prefix}_${Date.now()}${ext}`);
  }
});

// File Filter for Images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (PNG, JPG, JPEG, WEBP) are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }
});

const uploadBorrowerDocuments = upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'idProofImage', maxCount: 1 },
  { name: 'chequeImage', maxCount: 1 }
]);

module.exports = {
  upload,
  uploadBorrowerDocuments
};
