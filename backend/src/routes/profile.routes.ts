import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import authorize from '../middleware/authorize';
import { uploadCV, uploadAvatar, uploadCover } from '../middleware/upload';
import { UserRole } from '../utils/constants';
import * as controller from '../controllers/profile.controller';

const router = Router();

// ─────────────────────────────────────────────────
// Profile Routes (authenticated)
// ─────────────────────────────────────────────────

// Get / Update own profile
router.get('/me', authenticate, controller.getMyProfile);
router.put('/me', authenticate, controller.updateMyProfile);

// Projects (student only)
router.post('/me/projects', authenticate, authorize(UserRole.STUDENT), controller.addProject);
router.put('/me/projects/:id', authenticate, authorize(UserRole.STUDENT), controller.updateProject);
router.delete('/me/projects/:id', authenticate, authorize(UserRole.STUDENT), controller.deleteProject);

// Education (student only)
router.post('/me/education', authenticate, authorize(UserRole.STUDENT), controller.addEducation);
router.put('/me/education/:id', authenticate, authorize(UserRole.STUDENT), controller.updateEducation);
router.delete('/me/education/:id', authenticate, authorize(UserRole.STUDENT), controller.deleteEducation);

// Experiences (student only)
router.post('/me/experiences', authenticate, authorize(UserRole.STUDENT), controller.addExperience);
router.put('/me/experiences/:id', authenticate, authorize(UserRole.STUDENT), controller.updateExperience);
router.delete('/me/experiences/:id', authenticate, authorize(UserRole.STUDENT), controller.deleteExperience);

// CV (student only)
router.post('/me/cv', authenticate, authorize(UserRole.STUDENT), uploadCV, controller.uploadCV);
router.delete('/me/cv', authenticate, authorize(UserRole.STUDENT), controller.deleteCV);

// Avatar (any authenticated user)
router.post('/me/avatar', authenticate, uploadAvatar, controller.uploadAvatar);
router.delete('/me/avatar', authenticate, controller.deleteAvatar);

// Cover image (any authenticated user)
router.post('/me/cover', authenticate, uploadCover, controller.uploadCover);
router.delete('/me/cover', authenticate, controller.deleteCover);

// Delete account (any authenticated user)
router.delete('/me/account', authenticate, controller.deleteAccount);

// ─────────────────────────────────────────────────
// Public Profile Routes (no auth required)
// ─────────────────────────────────────────────────

router.get('/public/:username', controller.getPublicProfile);

export default router;
