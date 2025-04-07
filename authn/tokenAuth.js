import { SignJWT, jwtVerify } from "jose";
import { publicKey, privateKey } from "./getKeyPair.js";
import dotenv from 'dotenv';
import { mongoClient } from "../dbConnection.js";
import { performance } from "node:perf_hooks";
import { redisClient } from "../redisConnection.js";
import "../closeConnections.js";

dotenv.config({ path: "../.env" });

export const getIdToken = async (fullName, emailAddress) => {
    const userJwtKeyName = "user:jwt:" + emailAddress;
    const userJwtKeyValue = await redisClient.get(userJwtKeyName);
    if (userJwtKeyValue) {
        console.log("Cache hit");
        return userJwtKeyValue;
    }
    else {
        console.log("Cache miss");
        const newJwt = await generateIdToken(fullName, emailAddress);
        if (newJwt) {
            await redisClient.set(userJwtKeyName, newJwt, { EX: parseInt(`${process.env.JWT_EXPIRATION_SECONDS}`) });
            return newJwt;
        }
    }
}

export const generateIdToken = async (fullName, emailAddress) => {
    // [x] Validate if user exists in the database.
    // [x] If not, create a new user, and then generate the token.
    // [ ] While bloom filters sound amazing, they aren't useful for this specific scenario. Instead use redis to store user's email address after checking it from the redis database and making a trip to the persistant database in case of cache miss.
    try {
        console.log("Connected to database");

        const database = mongoClient.db(`${process.env.MONGO_DB_NAME}`);
        const collection = database.collection(`${process.env.MONGO_DB_COLLECTION_USERS}`);

        const isUserRegistered = await collection.findOne({ "emailAddress": emailAddress });
        if (isUserRegistered) {
            console.log("User is registered");
        } else {
            console.log("User is not registered.");

            const result = await collection.insertOne({
                "fullName": fullName,
                "emailAddress": emailAddress,
                "isActive": true,
                "created_at": new Date(),
                "created_by": emailAddress,
                "modified_on": null,
                "modified_by": null,
            });

            if (result.acknowledged) {
                console.log("User added.")
            }
        }
    } catch (ex) {
        console.error(ex)
    }

    // [ ] Performance metrics show that verifying if a user exists in the db takes approximately 600ms. This shows the utility for using Redis cache to verify if a user exists, possible through bloom filters. 
    
    return await new SignJWT({ 'sub': emailAddress, 'name': fullName })
        .setProtectedHeader({ alg: `${process.env.PUBLIC_KEY_ALGORITHM}`, typ: 'JWT' })
        .setIssuedAt()
        .setIssuer(`${process.env.JWT_ISSUER}`)
        .setAudience(`${process.env.JWT_AUDIENCE}`)
        .setExpirationTime(`${process.env.JWT_EXPIRATION}`)
        .sign(privateKey)
};

export const verifyIdToken = async (token) => {
    try {
        const { payload, protectedHeader } = await jwtVerify(token, publicKey, {
            issuer: `${process.env.JWT_ISSUER}`,
            audience: `${process.env.JWT_AUDIENCE}`
        });

        if (protectedHeader) {
            if (protectedHeader.alg === `${process.env.PUBLIC_KEY_ALGORITHM}` && protectedHeader.typ === "JWT") {
                if (payload.aud === `${process.env.JWT_AUDIENCE}` && payload.iss === `${process.env.JWT_ISSUER}`) {
                    const currentDT = Date.now();
                    const issuedAtDT = new Date(parseInt(payload.iat) * 1000);
                    const expirationDT = new Date(parseInt(payload.exp) * 1000);

                    if (currentDT >= issuedAtDT && currentDT <= expirationDT) {
                        // TODO Validate user from database.
                        return true;
                    } 
                }
            }
        }

        return false;
    } catch (ex) {
        console.error(ex);
    }
};

// JWT Workflow
// [x] Use getIdToken() to check if the user's JWT is stored in the redis cache.
// [x] If yes, use verifyIdToken to determine if the token is still valid.
// 3. If yes, the user is authorized to access the underlying APIs in the system.
// 4. If step 1 is false, generate a new token for the user if the user is already registered in the database, and store it in the cache.
// 5. If not, register the user and store the token in cache.
// 6. If step 2 is false, generate a new token for the user and store it in the cache.

const startJwtVal = performance.now();
const idToken = await getIdToken("Sharath Satish", "sharaths1998@gmail.com");
console.log(idToken);

const isValidToken = await verifyIdToken(idToken);
const endJwtVal = performance.now();
console.log(endJwtVal - startJwtVal);
console.log(isValidToken);
