import prisma from '../../config/db';
import { uploadToCloudinary } from '../../config/cloudinary';
import { notifyNewDiamondAdded } from '../../utils/whatsapp';
import { CreateDiamondInput, UpdateDiamondInput, FetchByCertificateInput } from './diamond.schema';
import { fetchGIACertificate, fetchIGICertificate } from './certificate.service';
import { extractCertificateData } from './ocr.service';
import { CertificateLab, UploadMethod } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const buildWhere = (query: Record<string, string>) => {
    const {
        businessId, shape, colors, caratMin, caratMax,
        clarities, priceMin, priceMax, lab, search,
    } = query;

    const where: Record<string, unknown> = { businessId };

    if (shape) where['shape'] = { in: shape.split(',').map((s) => s.trim()) };
    if (lab) where['certificateLab'] = { in: lab.split(',').map((l) => l.trim().toUpperCase()) };
    if (clarities) where['clarity'] = { in: clarities.split(',').map((c) => c.trim()) };

    // colors — comma-separated list of exact color grades (e.g. "D,E,F")
    // The admin/frontend decides which color grades to include; no hardcoded order.
    if (colors) where['color'] = { in: colors.split(',').map((c) => c.trim().toUpperCase()) };

    if (caratMin || caratMax) {
        where['carat'] = {
            ...(caratMin && { gte: parseFloat(caratMin) }),
            ...(caratMax && { lte: parseFloat(caratMax) }),
        };
    }

    if (priceMin || priceMax) {
        where['price'] = {
            ...(priceMin && { gte: parseFloat(priceMin) }),
            ...(priceMax && { lte: parseFloat(priceMax) }),
        };
    }

    if (search) {
        where['OR'] = [
            { certificateNumber: { contains: search, mode: 'insensitive' } },
            { shape: { contains: search, mode: 'insensitive' } },
        ];
    }

    return where;
};


// ─────────────────────────────────────────────────────────────────────────────
// SERVICE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const listDiamonds = async (query: Record<string, string>) => {
    const page = parseInt(query.page || '1');
    const limit = Math.min(parseInt(query.limit || '50'), 100);
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder: 'asc' | 'desc' = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const where = buildWhere(query);

    const [diamonds, total] = await Promise.all([
        prisma.diamond.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
        }),
        prisma.diamond.count({ where }),
    ]);

    return { diamonds, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getDiamondById = async (id: string) => {
    const diamond = await prisma.diamond.findUnique({ where: { id } });
    if (!diamond) throw Object.assign(new Error('Diamond not found'), { statusCode: 404 });
    return diamond;
};

export const createDiamond = async (
    input: CreateDiamondInput,
    files: {
        images?: Express.Multer.File[];
        video?: Express.Multer.File[];
        certificateFile?: Express.Multer.File[];
    }
) => {
    // Upload media to Cloudinary
    const imageUrls: string[] = [];
    if (files.images) {
        for (const f of files.images) {
            const url = await uploadToCloudinary(f.buffer, 'diamonds/images', 'image');
            imageUrls.push(url);
        }
    }

    let videoUrl: string | undefined;
    if (files.video?.[0]) {
        videoUrl = await uploadToCloudinary(files.video[0].buffer, 'diamonds/videos', 'video');
    }

    let certificateFileUrl: string | undefined;
    if (files.certificateFile?.[0]) {
        certificateFileUrl = await uploadToCloudinary(
            files.certificateFile[0].buffer, 'diamonds/certificates', 'raw'
        );
    }

    const diamond = await prisma.diamond.create({
        data: {
            businessId: input.businessId,
            shape: input.shape,
            carat: input.carat,
            color: input.color,
            clarity: input.clarity,
            price: input.price,
            cut: input.cut,
            polish: input.polish,
            symmetry: input.symmetry,
            fluorescence: input.fluorescence,
            measurements: input.measurements,
            certificateNumber: input.certificateNumber,
            certificateLab: input.certificateLab as CertificateLab | undefined,
            certificateFileUrl,
            images: imageUrls,
            videoUrl,
            uploadMethod: input.uploadMethod as UploadMethod,
        },
    });

    // Fire-and-forget WhatsApp notification (no-op until provider configured)
    const business = await prisma.business.findUnique({ where: { id: input.businessId } });
    if (business) {
        notifyNewDiamondAdded(
            business.whatsappNumber,
            business.name,
            diamond.shape,
            diamond.carat,
            diamond.color,
            diamond.clarity,
            diamond.certificateNumber
        ).catch(() => { });
    }

    return diamond;
};

export const updateDiamond = async (
    id: string,
    businessId: string,
    role: string,
    input: UpdateDiamondInput,
    files: {
        images?: Express.Multer.File[];
        video?: Express.Multer.File[];
        certificateFile?: Express.Multer.File[];
    }
) => {
    const diamond = await getDiamondById(id);

    // Ownership check for owners
    if (role === 'OWNER' && diamond.businessId !== businessId) {
        throw Object.assign(new Error('Forbidden: not your diamond'), { statusCode: 403 });
    }

    const imageUrls: string[] = [];
    if (files.images) {
        for (const f of files.images) {
            imageUrls.push(await uploadToCloudinary(f.buffer, 'diamonds/images', 'image'));
        }
    }

    let videoUrl: string | undefined;
    if (files.video?.[0]) {
        videoUrl = await uploadToCloudinary(files.video[0].buffer, 'diamonds/videos', 'video');
    }

    let certificateFileUrl: string | undefined;
    if (files.certificateFile?.[0]) {
        certificateFileUrl = await uploadToCloudinary(
            files.certificateFile[0].buffer, 'diamonds/certificates', 'raw'
        );
    }

    return prisma.diamond.update({
        where: { id },
        data: {
            ...input,
            certificateLab: input.certificateLab as CertificateLab | undefined,
            uploadMethod: input.uploadMethod as UploadMethod | undefined,
            ...(imageUrls.length > 0 && { images: imageUrls }),
            ...(videoUrl && { videoUrl }),
            ...(certificateFileUrl && { certificateFileUrl }),
        },
    });
};

export const deleteDiamond = async (id: string, businessId: string, role: string) => {
    const diamond = await getDiamondById(id);
    if (role === 'OWNER' && diamond.businessId !== businessId) {
        throw Object.assign(new Error('Forbidden: not your diamond'), { statusCode: 403 });
    }
    await prisma.inquiry.deleteMany({ where: { diamondId: id } });
    await prisma.diamond.delete({ where: { id } });
};

export const fetchByCertificate = async (input: FetchByCertificateInput) => {
    if (input.lab === 'GIA') return fetchGIACertificate(input.certificateNumber);
    if (input.lab === 'IGI') return fetchIGICertificate(input.certificateNumber);
    throw Object.assign(new Error('Unsupported lab'), { statusCode: 400 });
};

export const extractCertificate = async (file: Express.Multer.File) => {
    return extractCertificateData(file.buffer, file.mimetype);
};
