import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    console.log('Multer processing file:', file.originalname, file.mimetype);
    const date = new Date();
    const timestamp = date.toISOString();
    const uniqueId = uuidv4();
    const finalName = `${uniqueId}${path.extname(file.originalname)}`;
    cb(null, finalName);
    console.log('Generated filename:', finalName);
  },
});

// File filter to only allow images and PDFs
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.'
      )
    );
  }
};

// Configure multer

export const fileUploadOptions = {
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
};
export const upload = multer(fileUploadOptions);

// Export middleware function that handles both JSON and file uploads
// export const upload = multer();
