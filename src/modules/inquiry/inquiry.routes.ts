import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createInquirySchema } from './inquiry.schema';
import * as ctrl from './inquiry.controller';

const router = Router();

/**
 * @route  POST /api/inquiries
 * @desc   Submit a client inquiry (public)
 * @access Public
 * @body   { businessId, diamondId?, name, email, phone?, message }
 * @returns { success, message: 'Inquiry submitted successfully' }
 * @sideEffects Sends email + WhatsApp notification to business owner
 * @errors 400 Validation | 404 Business not found
 */
router.post('/', validate(createInquirySchema), ctrl.createInquiry);

/**
 * @route  GET /api/inquiries
 * @desc   List inquiries (owners see only their business; admin sees all)
 * @access Owner | Super Admin
 * @query  businessId?, diamondId?, page?, limit?
 * @returns { success, data: { inquiries[], total, page, limit, totalPages } }
 * @errors 401 | 403
 */
router.get('/', authenticate, requireRole('OWNER', 'SUPER_ADMIN'), ctrl.listInquiries);

/**
 * @route  GET /api/inquiries/:id
 * @desc   Get single inquiry
 * @access Owner (own business) | Super Admin
 * @returns { success, data: Inquiry }
 * @errors 401 | 403 | 404
 */
router.get('/:id', authenticate, requireRole('OWNER', 'SUPER_ADMIN'), ctrl.getInquiryById);

export default router;
