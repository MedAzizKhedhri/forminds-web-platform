import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import authorize from '../middleware/authorize';
import { UserRole } from '../utils/constants';
import * as controller from '../controllers/matching.controller';

const router = Router();

// ─────────────────────────────────────────────────
// Matching Routes (all authenticated, student only)
// ─────────────────────────────────────────────────

router.get('/recommendations', authenticate, authorize(UserRole.STUDENT), controller.getRecommendations);
router.get('/score/:opportunityId', authenticate, authorize(UserRole.STUDENT), controller.getMatchScore);

export default router;
