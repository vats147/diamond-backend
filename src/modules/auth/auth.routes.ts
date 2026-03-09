import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { adminLoginSchema, ownerLoginSchema } from './auth.schema';
import * as authController from './auth.controller';

const router = Router();

/**
 * @route  POST /api/auth/admin/login
 * @desc   Super Admin login
 * @access Public
 * @body   { email, password }
 * @returns { success, data: { token, user: { id, role } } }
 * @errors 401 Invalid credentials | 400 Validation
 */
router.post('/admin/login', validate(adminLoginSchema), authController.adminLogin);

/**
 * @route  POST /api/auth/owner/login
 * @desc   Business owner login
 * @access Public
 * @body   { businessSlug, email, password }
 * @returns { success, data: { token, user: { id, role, businessId } } }
 * @errors 401 Invalid credentials | 404 Business not found | 400 Validation
 */
router.post('/owner/login', validate(ownerLoginSchema), authController.ownerLogin);

/**
 * @route  POST /api/auth/logout
 * @desc   Logout (client-side token disposal)
 * @access Protected
 * @returns { success, message: 'Logged out successfully' }
 */
router.post('/logout', authenticate, authController.logout);

export default router;
