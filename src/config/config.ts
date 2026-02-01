import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = z.object({
    NODE_ENV: z.enum(['production', 'development', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
});

const envVars = envSchema.safeParse(process.env);

if (!envVars.success) {
    throw new Error(`Config validation error: ${envVars.error.message}`);
}

export default {
    env: envVars.data.NODE_ENV,
    port: envVars.data.PORT,
    mongoose: {
        // keeping structure for future if needed, but using prisma now
    },
    databaseUrl: envVars.data.DATABASE_URL,
};
