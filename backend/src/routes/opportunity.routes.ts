import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import authorize from '../middleware/authorize';
import { UserRole } from '../utils/constants';
import * as controller from '../controllers/opportunity.controller';

const router = Router();

// ─────────────────────────────────────────────────
// Public Routes
// ─────────────────────────────────────────────────

router.get('/', controller.searchOpportunities);

// ─────────────────────────────────────────────────
// Authenticated / Recruiter Routes
// ─────────────────────────────────────────────────

// /mine must come BEFORE /:opportunityId to avoid param conflict
router.get('/mine', authenticate, authorize(UserRole.RECRUITER), controller.getRecruiterOpportunities);

router.post('/', authenticate, authorize(UserRole.RECRUITER), controller.createOpportunity);
router.get('/:opportunityId', controller.getOpportunity);
router.patch('/:opportunityId', authenticate, authorize(UserRole.RECRUITER), controller.updateOpportunity);
router.patch('/:opportunityId/close', authenticate, authorize(UserRole.RECRUITER), controller.closeOpportunity);
router.patch('/:opportunityId/reopen', authenticate, authorize(UserRole.RECRUITER), controller.reopenOpportunity);
router.delete('/:opportunityId', authenticate, authorize(UserRole.RECRUITER), controller.deleteOpportunity);

export default router;
