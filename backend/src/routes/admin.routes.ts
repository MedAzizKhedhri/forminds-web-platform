import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import authorize from '../middleware/authorize';
import { UserRole } from '../utils/constants';
import * as controller from '../controllers/admin.controller';

const router = Router();

// All routes require authenticate + authorize(ADMIN)
router.get('/stats', authenticate, authorize(UserRole.ADMIN), controller.getStats);
router.get('/opportunities', authenticate, authorize(UserRole.ADMIN), controller.getPendingOpportunities);
router.patch('/opportunities/:opportunityId', authenticate, authorize(UserRole.ADMIN), controller.validateOpportunity);
router.get('/recruiters', authenticate, authorize(UserRole.ADMIN), controller.getUnverifiedRecruiters);
router.patch('/recruiters/:userId/verify', authenticate, authorize(UserRole.ADMIN), controller.verifyRecruiter);
router.get('/audit-log', authenticate, authorize(UserRole.ADMIN), controller.getAuditLogs);
router.get('/events', authenticate, authorize(UserRole.ADMIN), controller.getPendingEvents);
router.patch('/events/:eventId', authenticate, authorize(UserRole.ADMIN), controller.validateEvent);

export default router;
