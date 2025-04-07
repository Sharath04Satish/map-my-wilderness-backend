import dotenv from 'dotenv';
import { MongoClient, ServerApiVersion } from 'mongodb';

dotenv.config();
const uri = `${process.env.MONGO_DB_URI}`;

export const mongoClient = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

try {
    (async () => {
        await mongoClient.connect();
    })();
} catch (err) {
    console.log("Unable to connect to the database due to", err.message);
}

export const closeMongoConnection = async () => {
    try {
        await mongoClient.close();
        console.log("\nMongoDB client disconnected.");
    } catch (err) {
        console.error("Unable to close mongodb connection due to", err.message);
    }
}
