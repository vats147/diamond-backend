import { Router } from 'express';
import * as ctrl from './metadata.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { updateMetadataSchema } from './metadata.schema';

const router = Router();

/**
 * @route  GET /api/metadata
 * @desc   Get global filter options (Public)
 * @access Public
 */
router.get('/', ctrl.getMetadata);

/**
 * @route  PUT /api/admin/metadata
 * @desc   Update global filter options
 * @access Super Admin
 */
router.put(
    '/admin',
    authenticate,
    requireRole('SUPER_ADMIN'),
    validate(updateMetadataSchema),
    ctrl.updateMetadata
);

export default router;
