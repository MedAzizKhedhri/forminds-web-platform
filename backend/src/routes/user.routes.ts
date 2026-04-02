import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import authorize from '../middleware/authorize';
import { UserRole } from '../utils/constants';
import * as controller from '../controllers/user.controller';

const router = Router();

// ─────────────────────────────────────────────────
// Admin-only User Management Routes
// ─────────────────────────────────────────────────

router.get('/', authenticate, authorize(UserRole.ADMIN), controller.listUsers);
router.get('/:id', authenticate, authorize(UserRole.ADMIN), controller.getUserById);
router.patch('/:id/status', authenticate, authorize(UserRole.ADMIN), controller.updateUserStatus);

export default router;
