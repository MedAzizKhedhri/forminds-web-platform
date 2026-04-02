import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import authorize from '../middleware/authorize';
import { UserRole } from '../utils/constants';
import * as controller from '../controllers/application.controller';

const router = Router();

// ─────────────────────────────────────────────────
// Application Routes (all authenticated)
// ─────────────────────────────────────────────────

router.post('/', authenticate, authorize(UserRole.STUDENT), controller.apply);
router.get('/mine', authenticate, authorize(UserRole.STUDENT), controller.getStudentApplications);
router.get('/recruiter', authenticate, authorize(UserRole.RECRUITER), controller.getRecruiterApplications);
router.get('/opportunity/:oppId', authenticate, authorize(UserRole.RECRUITER), controller.getOpportunityApplications);
router.get('/:applicationId', authenticate, controller.getApplication);
router.patch('/:applicationId/status', authenticate, authorize(UserRole.RECRUITER), controller.updateApplicationStatus);

export default router;
