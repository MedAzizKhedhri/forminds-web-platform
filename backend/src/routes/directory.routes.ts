import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as controller from '../controllers/directory.controller';

const router = Router();

// ─────────────────────────────────────────────────
// Directory Routes (authenticated)
// ─────────────────────────────────────────────────

router.get('/', authenticate, controller.searchProfiles);

export default router;
