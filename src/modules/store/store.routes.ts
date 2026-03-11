import { Router } from "express";
import {
  getStorefront,
  listStoreDiamonds,
  downloadStoreDiamonds,
  getStoreDiamond,
} from "./store.controller";

const router = Router();

/**
 * @route  GET /api/store/:slug
 * @desc   Public storefront landing – business profile + first 50 AVAILABLE diamonds
 * @access Public
 * @returns { success, data: { business, diamonds[], total } }
 *          Each diamond includes shareUrl + whatsappInquiryUrl
 */
router.get("/:slug", getStorefront);

/**
 * @route  GET /api/store/:slug/diamonds
 * @desc   Paginated, filterable list of AVAILABLE diamonds for the public storefront
 * @access Public
 * @query  page?, limit?, sortBy?, sortOrder?,
 *         shape?, lab?, color?, clarity?, cut?, polish?, symmetry?, fluorescence?,
 *         caratMin?, caratMax?, priceMin?, priceMax?,
 *         tableMin?, tableMax?, depthMin?, depthMax?,
 *         ratioMin?, ratioMax?, lengthMin?, lengthMax?, widthMin?, widthMax?,
 *         shade?, luster?, culet?, girdle?, heartsAndArrows?, location?,
 *         search?
 * @returns { success, data: { business, diamonds[], total, page, limit, totalPages, downloadUrl } }
 *          Each diamond includes shareUrl + whatsappInquiryUrl
 */
router.get("/:slug/diamonds", listStoreDiamonds);

/**
 * @route  GET /api/store/:slug/diamonds/download
 * @desc   Download all AVAILABLE diamonds as an Excel or CSV file.
 *         The file header includes the organisation name, contact info, and timestamp.
 *         Supports the same filter query params as the list endpoint.
 * @access Public
 * @query  format? = "xlsx" (default) | "csv"
 *         + all filter params from the list endpoint
 * @returns Binary file attachment
 */
router.get("/:slug/diamonds/download", downloadStoreDiamonds);

/**
 * @route  GET /api/store/:slug/diamonds/:id
 * @desc   Single AVAILABLE diamond detail with shareUrl + whatsappInquiryUrl
 * @access Public
 * @returns { success, data: Diamond & { shareUrl, whatsappInquiryUrl } }
 * @errors 404 Business or Diamond not found / not available
 */
router.get("/:slug/diamonds/:id", getStoreDiamond);

export default router;
