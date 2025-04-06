import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();
const uri = `${process.env.REDIS_DB_URI}`;

export const redisClient = createClient({
    url: uri,
    socket: {
        connectTimeout: 10000,
        reconnectStrategy: retries => retries > 3 ? new Error('Maximum reconnection attempts exceeded.') : 1000
    }
});
