import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as controller from '../controllers/connection.controller';

const router = Router();

// ─────────────────────────────────────────────────
// Connection Routes (all authenticated)
// ─────────────────────────────────────────────────

router.post('/request', authenticate, controller.sendRequest);
router.get('/', authenticate, controller.getConnections);
router.get('/pending', authenticate, controller.getPendingRequests);
router.get('/sent', authenticate, controller.getSentRequests);
router.get('/suggestions', authenticate, controller.getSuggestions);
router.get('/status/:userId', authenticate, controller.getConnectionStatus);
router.patch('/:connectionId', authenticate, controller.respondToRequest);
router.delete('/:connectionId', authenticate, controller.removeConnection);

export default router;
