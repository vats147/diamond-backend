import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { upload } from '../../middleware/upload.middleware';
import { createDiamondSchema, updateDiamondSchema, fetchByCertificateSchema } from './diamond.schema';
import * as ctrl from './diamond.controller';

const router = Router();

/**
 * @route  GET /api/diamonds
 * @desc   List diamonds with filters + pagination
 * @access Public (storefront) or Owner (management)
 * @query  businessId (required), shape, colorMin, colorMax, caratMin, caratMax,
 *         clarities, priceMin, priceMax, lab, search, page, limit, sortBy, sortOrder
 * @returns { success, data: { diamonds[], total, page, limit, totalPages } }
 * @errors 400 Missing businessId
 */
router.get('/', optionalAuthenticate, ctrl.listDiamonds);

/**
 * @route  POST /api/diamonds/fetch-by-certificate
 * @desc   Fetch diamond data from GIA or IGI by certificate number
 * @access Owner | Super Admin
 * @body   { certificateNumber: string, lab: 'GIA' | 'IGI' }
 * @returns { success, data: { certificateNumber, shape, carat, color, clarity, ... } }
 * @errors 400 Validation | 401 | 403 | 422 Fetch failed
 */
router.post(
    '/fetch-by-certificate',
    authenticate,
    requireRole('OWNER', 'SUPER_ADMIN'),
    validate(fetchByCertificateSchema),
    ctrl.fetchByCertificate
);

/**
 * @route  POST /api/diamonds/extract-certificate
 * @desc   Upload certificate file (PDF/image) and extract data via OCR
 * @access Owner | Super Admin
 * @body   multipart/form-data { certificate: file }
 * @returns { success, data: { certificateNumber, shape, carat, ..., confidence } }
 * @errors 400 No file | 401 | 403 | 422 Extraction failed
 */
router.post(
    '/extract-certificate',
    authenticate,
    requireRole('OWNER', 'SUPER_ADMIN'),
    upload.single('certificate'),
    ctrl.extractCertificate
);

/**
 * @route  POST /api/diamonds/seed
 * @desc   Seed 5 dummy diamonds for the logged-in owner's business
 * @access Owner
 * @returns { success, data }
 */
router.post(
    '/seed',
    authenticate,
    requireRole('OWNER'),
    ctrl.seedDiamonds
);

/**
 * @route  POST /api/diamonds/bulk-upload
 * @desc   Upload an Excel/CSV file to bulk insert diamonds
 * @access Owner | Super Admin
 * @body   multipart/form-data { file: file }
 * @returns { success, data: { insertedCount, failedCount, errors } }
 */
router.post(
    '/bulk-upload',
    authenticate,
    requireRole('OWNER', 'SUPER_ADMIN'),
    upload.single('file'),
    ctrl.bulkUpload
);

/**
 * @route  GET /api/diamonds/:id
 * @desc   Get single diamond by ID
 * @access Public
 * @returns { success, data: Diamond }
 * @errors 404 Not found
 */
router.get('/:id', ctrl.getDiamondById);

/**
 * @route  POST /api/diamonds
 * @desc   Add diamond to inventory
 * @access Owner | Super Admin
 * @body   multipart/form-data { businessId, shape, carat, color, clarity, price,
 *         uploadMethod, cut?, polish?, symmetry?, fluorescence?, measurements?,
 *         certificateNumber?, certificateLab?, certificateFile?, images?, video? }
 * @returns { success, data: Diamond }
 * @errors 400 Validation | 401 | 403
 */
router.post(
    '/',
    authenticate,
    requireRole('OWNER', 'SUPER_ADMIN'),
    upload.fields([
        { name: 'images', maxCount: 10 },
        { name: 'video', maxCount: 1 },
        { name: 'certificateFile', maxCount: 1 },
    ]),
    validate(createDiamondSchema),
    ctrl.createDiamond
);

/**
 * @route  PUT /api/diamonds/:id
 * @desc   Update diamond (owners may only update their own diamonds)
 * @access Owner (own business) | Super Admin
 * @body   multipart/form-data (all fields optional)
 * @returns { success, data: Diamond }
 * @errors 400 | 401 | 403 | 404
 */
router.put(
    '/:id',
    authenticate,
    requireRole('OWNER', 'SUPER_ADMIN'),
    upload.fields([
        { name: 'images', maxCount: 10 },
        { name: 'video', maxCount: 1 },
        { name: 'certificateFile', maxCount: 1 },
    ]),
    validate(updateDiamondSchema),
    ctrl.updateDiamond
);

/**
 * @route  DELETE /api/diamonds/:id
 * @desc   Delete a diamond (owners may only delete their own diamonds)
 * @access Owner (own business) | Super Admin
 * @returns { success, message: 'Diamond deleted' }
 * @errors 401 | 403 | 404
 */
router.delete('/:id', authenticate, requireRole('OWNER', 'SUPER_ADMIN'), ctrl.deleteDiamond);

export default router;
