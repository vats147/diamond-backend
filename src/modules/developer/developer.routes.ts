import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createApiKeySchema } from './developer.schema';
import * as ctrl from './developer.controller';

const router = Router();

// Developer panel endpoints require active Owner UI login
router.use(authenticate, requireRole('OWNER'));

/**
 * @route   POST /api/developer/keys
 * @desc    Generate a new API Key for the business
 * @access  Owner 
 * @body    { name: string }
 * @returns { success, data: { id, name, key, createdAt } }
 * @errors  400 Validation | 401 | 403
 */
router.post('/keys', validate(createApiKeySchema), ctrl.createApiKey);

/**
 * @route   GET /api/developer/keys
 * @desc    List active API keys (metadata only)
 * @access  Owner 
 * @returns { success, data: [ { id, name, createdAt, lastUsedAt } ] }
 * @errors  401 | 403
 */
router.get('/keys', ctrl.listApiKeys);

/**
 * @route   DELETE /api/developer/keys/:id
 * @desc    Revoke and delete an API key immediately
 * @access  Owner 
 * @returns { success, message }
 * @errors  401 | 403 | 404
 */
router.delete('/keys/:id', ctrl.revokeApiKey);

export default router;
