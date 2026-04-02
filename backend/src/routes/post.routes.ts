import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as controller from '../controllers/post.controller';

const router = Router();

// ─────────────────────────────────────────────────
// Post / Social Feed Routes (all authenticated)
// ─────────────────────────────────────────────────

router.post('/', authenticate, controller.createPost);
router.get('/', authenticate, controller.getFeed);
router.get('/:postId', authenticate, controller.getPost);
router.patch('/:postId', authenticate, controller.updatePost);
router.delete('/:postId', authenticate, controller.deletePost);

// Likes
router.post('/:postId/like', authenticate, controller.likePost);
router.delete('/:postId/like', authenticate, controller.unlikePost);

// Comments
router.post('/:postId/comments', authenticate, controller.addComment);
router.get('/:postId/comments', authenticate, controller.getComments);
router.delete('/:postId/comments/:commentId', authenticate, controller.deleteComment);

export default router;
