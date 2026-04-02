import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import authorize from '../middleware/authorize';
import { uploadEventImage } from '../middleware/upload';
import { UserRole } from '../utils/constants';
import * as controller from '../controllers/event.controller';

const router = Router();

// ─────────────────────────────────────────────────
// Event Routes
// ─────────────────────────────────────────────────

// Static routes MUST come before :eventId param routes

// Public
router.get('/', controller.listEvents);

// Authenticated — student registrations
router.get('/registrations/mine', authenticate, controller.getUserRegistrations);

// Organizer (Recruiter only - Admin only approves/rejects events)
router.post('/', authenticate, authorize(UserRole.RECRUITER), controller.createEvent);
router.post('/upload-image', authenticate, authorize(UserRole.RECRUITER), uploadEventImage, controller.uploadEventImage);
router.get('/organizer/mine', authenticate, authorize(UserRole.RECRUITER), controller.getOrganizerEvents);

// Parameterized routes
router.get('/:eventId', controller.getEvent);
router.patch('/:eventId', authenticate, authorize(UserRole.RECRUITER), controller.updateEvent);
router.patch('/:eventId/cancel', authenticate, authorize(UserRole.RECRUITER), controller.cancelEvent);
router.delete('/:eventId', authenticate, authorize(UserRole.RECRUITER), controller.deleteEvent);
router.post('/:eventId/register', authenticate, controller.registerForEvent);
router.delete('/:eventId/register', authenticate, controller.cancelRegistration);
router.get('/:eventId/my-registration', authenticate, controller.getMyRegistration);
router.post('/:eventId/checkin', authenticate, authorize(UserRole.RECRUITER), controller.checkin);
router.get('/:eventId/participants', authenticate, authorize(UserRole.RECRUITER), controller.getEventParticipants);

export default router;
