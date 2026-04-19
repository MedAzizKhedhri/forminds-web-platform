import { Router } from 'express';
import { authRateLimiter, passwordResetLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/authenticate';
import * as controller from '../controllers/auth.controller';

const router = Router();

// ─────────────────────────────────────────────────
// Public Routes
// ─────────────────────────────────────────────────

router.post('/register', authRateLimiter, controller.register);
router.post('/login', authRateLimiter, controller.login);
router.post('/verify-email', controller.verifyEmail);
router.post('/resend-verification', authRateLimiter, controller.resendVerification);
router.post('/forgot-password', passwordResetLimiter, controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);
router.post('/verify-2fa', authRateLimiter, controller.verify2FA);
router.post('/refresh', controller.refresh);

// ─────────────────────────────────────────────────
// Protected Routes (require authentication)
// ─────────────────────────────────────────────────

router.post('/logout', authenticate, controller.logout);
router.post('/change-password', authenticate, controller.changePassword);
router.post('/enable-2fa', authenticate, controller.enable2FA);
router.post('/confirm-2fa', authenticate, controller.confirm2FA);
router.post('/disable-2fa', authenticate, controller.disable2FA);
router.get('/me', authenticate, controller.getMe);

export default router;
