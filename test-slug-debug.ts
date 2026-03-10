import { PrismaClient } from '@prisma/client';
import { softDeleteExtension } from './src/config/prisma-extension';

async function main() {
    const prismaBase = new PrismaClient();
    const prismaExtended = prismaBase.$extends(softDeleteExtension);

    console.log('--- Testing check-slug/yash-desai ---');
    const slug = 'yash-desai';

    try {
        console.log('\n1. Checking with findMany (Base Prisma):');
        const countBase = await prismaBase.business.findMany({
            where: { slug }
        });
        console.log('Results found:', countBase.length);
        if (countBase.length > 0) {
            console.log('First record:', JSON.stringify(countBase[0], null, 2));
        }

        console.log('\n2. Checking with findFirst (Extended Prisma):');
        const existingExtended = await prismaExtended.business.findFirst({
            where: { slug }
        });
        console.log('Result found:', existingExtended ? 'YES' : 'NO');
        if (existingExtended) {
            console.log('Record:', JSON.stringify(existingExtended, null, 2));
        }

        console.log('\n3. Manual check for deletedAt:');
        const raw = await prismaBase.business.findFirst({
            where: { slug },
            select: { id: true, slug: true, deletedAt: true }
        } as any);
        console.log('Raw data:', JSON.stringify(raw, null, 2));

    } catch (error) {
        console.error('Error during test:', error);
    } finally {
        await prismaBase.$disconnect();
    }
}

main();
