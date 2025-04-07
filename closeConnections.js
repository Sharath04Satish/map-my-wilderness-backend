import { closeMongoConnection } from "./dbConnection.js";
import { closeRedisConnection } from "./redisConnection.js";

let isShutingDown = false;

const gracefulShutdown = async () => {
    if (isShutingDown) {
        return;
    }
    isShutingDown = true;

    try {
        await closeMongoConnection();
    } catch (err) {
        console.log("Unable to close database connection due to", err.message);
    }

    try {
        await closeRedisConnection();
    } catch (err) {
        console.log("Unable to close cache connection due to", err.message);
    }

    process.exit(0);
}

process.on('SIGINT', gracefulShutdown);
