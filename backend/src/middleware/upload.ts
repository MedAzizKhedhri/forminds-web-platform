import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';
import config from '../config';
import AppError from '../utils/AppError';

// Ensure upload directories exist
const cvDir = path.join(config.upload.dir, 'cv');
const avatarDir = path.join(config.upload.dir, 'avatars');
const coverDir = path.join(config.upload.dir, 'covers');
const eventImageDir = path.join(config.upload.dir, 'events');

if (!fs.existsSync(cvDir)) {
  fs.mkdirSync(cvDir, { recursive: true });
}

if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

if (!fs.existsSync(coverDir)) {
  fs.mkdirSync(coverDir, { recursive: true });
}

if (!fs.existsSync(eventImageDir)) {
  fs.mkdirSync(eventImageDir, { recursive: true });
}

// CV storage configuration
const cvStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, cvDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// Avatar storage configuration
const avatarStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, avatarDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// Cover image storage configuration
const coverStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, coverDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// CV file filter - PDF only
const cvFileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new AppError('Only PDF files are allowed for CV uploads.', 400));
  }
};

// Image file filter - JPEG, PNG, WebP only
const imageFileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG, PNG, and WebP images are allowed.', 400));
  }
};

// CV upload middleware - 10MB max
const cvUpload = multer({
  storage: cvStorage,
  fileFilter: cvFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
}).single('cv');

export const uploadCV = (req: Request, res: Response, next: NextFunction): void => {
  cvUpload(req, res, (err) => {
    if (err) return next(err);
    next();
  });
};

// Avatar upload middleware - 5MB max
const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).single('avatar');

export const uploadAvatar = (req: Request, res: Response, next: NextFunction): void => {
  avatarUpload(req, res, (err) => {
    if (err) return next(err);
    next();
  });
};

// Cover image upload middleware - 5MB max
const coverUpload = multer({
  storage: coverStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).single('cover');

export const uploadCover = (req: Request, res: Response, next: NextFunction): void => {
  coverUpload(req, res, (err) => {
    if (err) return next(err);
    next();
  });
};

// Event image storage configuration
const eventImageStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, eventImageDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// Event image upload middleware - 5MB max
const eventImageUpload = multer({
  storage: eventImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).single('image');

export const uploadEventImage = (req: Request, res: Response, next: NextFunction): void => {
  eventImageUpload(req, res, (err) => {
    if (err) return next(err);
    next();
  });
};
