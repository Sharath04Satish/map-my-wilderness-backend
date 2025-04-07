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

try {
    (async () => {
        await redisClient.connect();
    })();
} catch (err) {
    console.erroe("Unable to establish a connection to redis database due to", err.message);
}

export const closeRedisConnection = async () => {
    try {
        await redisClient.quit();
        console.log("Redis client disconnected.");
    } catch (err) {
        console.error("Unable to close redis connection due to", err.message);
    } 
}
