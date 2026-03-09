import { Router } from 'express';
import { requireApiKey } from '../../middleware/apikey.middleware';
import { validate } from '../../middleware/validate.middleware';
// We reuse the existing Zod validations, but we omit the explicit 'businessId' since the API key infers it securely
import { createDiamondSchema, updateDiamondSchema } from '../diamond/diamond.schema';
import * as ctrl from './external.controller';

const router = Router();

// ==========================================
// ALL ROUTES PROTECTED BY x-api-key
// ==========================================
router.use(requireApiKey);

/**
 * @route   GET /api/v1/diamonds
 * @desc    List all diamonds for the authorized business
 * @access  API Key
 */
router.get('/diamonds', ctrl.extListDiamonds);

/**
 * @route   POST /api/v1/diamonds
 * @desc    Create a new diamond programmatically
 * @access  API Key
 */
// Temporary hack: we are reusing createDiamondSchema which expects businessId,
// so our middleware/controller injects it, but the rigid validation requires it. We will bypass exact schema validate here if needed,
// or we validate the body and let the controller enforce the ID.
router.post(
    '/diamonds',
    (req, res, next) => {
        // Inject businessId into the body so Zod validation passes, but we enforce it matches the API Key token inside the controller.
        req.body.businessId = (req as any).businessId;
        next();
    },
    validate(createDiamondSchema),
    ctrl.extCreateDiamond
);

/**
 * @route   PUT /api/v1/diamonds/:id
 * @desc    Update a diamond programmatically
 * @access  API Key
 */
router.put('/diamonds/:id', validate(updateDiamondSchema), ctrl.extUpdateDiamond);

/**
 * @route   DELETE /api/v1/diamonds/:id
 * @desc    Delete a diamond programmatically
 * @access  API Key
 */
router.delete('/diamonds/:id', ctrl.extDeleteDiamond);

export default router;
