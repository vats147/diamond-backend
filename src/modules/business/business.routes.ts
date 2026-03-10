import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { upload } from '../../middleware/upload.middleware';
import {
    createBusinessSchema,
    updateBusinessSchema,
    themeSchema,
    createOwnerUserSchema,
    updateUserStatusSchema,
    resetUserPasswordSchema
} from './business.schema';
import * as ctrl from './business.controller';

const router = Router();

router.get('/check-slug/:slug', ctrl.checkSlugAvailability);
router.get('/', authenticate, requireRole('SUPER_ADMIN'), ctrl.listBusinesses);

/**
 * @route  GET /api/businesses/:id
 * @desc   Get business by ID
 * @access Super Admin
 */
router.get('/:id', authenticate, requireRole('SUPER_ADMIN'), ctrl.getBusinessById);

/**
 * @route  GET /api/businesses/slug/:slug/branding
 * @desc   Get branding data for a business slug
 * @access Public
 */
router.get('/slug/:slug/branding', optionalAuthenticate, ctrl.getBranding);

/**
 * @route  POST /api/businesses
 * @desc   Create new business + owner account
 * @access Super Admin
 * @body   multipart/form-data { name, contactNumber, ownerName, email, whatsappNumber, ownerPassword, logo?, font? }
 * @returns { success, data: Business }
 * @errors 400 Validation | 409 Duplicate email/slug | 401 | 403
 */
router.post(
    '/',
    authenticate,
    requireRole('SUPER_ADMIN'),
    upload.fields([{ name: 'logo', maxCount: 1 }]),
    validate(createBusinessSchema),
    ctrl.createBusiness
);

/**
 * @route  PUT /api/businesses/:id
 * @desc   Update business details
 * @access Super Admin
 * @body   multipart/form-data (all fields optional, same as POST minus ownerPassword)
 * @returns { success, data: Business }
 * @errors 400 | 401 | 403 | 404
 */
router.put(
    '/:id',
    authenticate,
    requireRole('SUPER_ADMIN'),
    upload.fields([{ name: 'logo', maxCount: 1 }]),
    validate(updateBusinessSchema),
    ctrl.updateBusiness
);

/**
 * @route  DELETE /api/businesses/:id
 * @desc   Delete a business and all its data
 * @access Super Admin
 * @returns { success, message: 'Business deleted' }
 * @errors 401 | 403 | 404
 */
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN'), ctrl.deleteBusiness);

/**
 * @route  PUT /api/businesses/:id/theme
 * @desc   Set or update business theme
 * @access Super Admin
 * @body   { primaryColor?, secondaryColor?, accentColor?, font? }
 * @returns { success, data: Business }
 * @errors 400 | 401 | 403 | 404
 */
router.put('/:id/theme', authenticate, requireRole('SUPER_ADMIN'), validate(themeSchema), ctrl.setTheme);

/**
 * @route  GET /api/businesses/:id/users
 * @desc   Get all users for a business
 * @access Super Admin
 */
router.get(
    '/:id/users',
    authenticate,
    requireRole('SUPER_ADMIN'),
    ctrl.getBusinessUsers
);

/**
 * @route  POST /api/businesses/:id/users
 * @desc   Create an owner login account for a business
 * @access Super Admin
 * @body   { email, password }
 * @returns { success, data: { id, email, role, businessId } }
 * @errors 400 | 401 | 403 | 404 | 409
 */
router.post(
    '/:id/users',
    authenticate,
    requireRole('SUPER_ADMIN'), // TODO: Also allow Business OWNER to manage their own users
    validate(createOwnerUserSchema),
    ctrl.createOwnerUser
);

/**
 * @route  PUT /api/businesses/:id/users/:userId/status
 * @desc   Toggle user access status
 * @access Super Admin
 */
router.put(
    '/:id/users/:userId/status',
    authenticate,
    validate(updateUserStatusSchema),
    ctrl.toggleUserStatus
);

/**
 * @route  PUT /api/businesses/:id/users/:userId/password
 * @desc   Reset user password
 * @access Super Admin
 */
router.put(
    '/:id/users/:userId/password',
    authenticate,
    validate(resetUserPasswordSchema),
    ctrl.resetUserPassword
);

/**
 * @route  DELETE /api/businesses/:id/users/:userId
 * @desc   Remove a user from a business
 * @access Super Admin or Business Owner
 * @returns { success, message: 'User removed' }
 * @errors 401 | 403 | 404
 */
router.delete(
    '/:id/users/:userId',
    authenticate,
    ctrl.removeUser
);

export default router;
