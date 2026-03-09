import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (
    buffer: Buffer,
    folder: string,
    resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: resourceType },
            (err, result) => {
                if (err) reject(err);
                else resolve(result!.secure_url);
            }
        );
        stream.end(buffer);
    });
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
    await cloudinary.uploader.destroy(publicId);
};

export default cloudinary;
