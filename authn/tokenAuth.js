import { SignJWT, jwtVerify } from "jose";
import { publicKey, privateKey } from "./getKeyPair.js";
import dotenv from 'dotenv';
import { getDbClient } from "../dbConnection.js";
import { performance } from "node:perf_hooks";

dotenv.config({ path: "../.env" });

export const generateIdToken = async (fullName, emailAddress) => {
    // [x] Validate if user exists in the database.
    // [x] If not, create a new user, and then generate the token.
    const stDb = performance.now();
    const client = await getDbClient();
    try {
        await client.connect();
        console.log("Connected to database");

        const database = client.db(`${process.env.MONGO_DB_NAME}`);
        const collection = database.collection(`${process.env.MONGO_DB_COLLECTION_USERS}`);

        const isUserRegistered = await collection.findOne({"emailAddress": emailAddress});
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
    } finally {
        await client.close();
    }

    const endDb = performance.now();
    console.log(endDb - stDb);
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

const startJwt = performance.now();
const token = await generateIdToken("Sharath Satish", "sharaths1998@gmail.com");
const endJwt = performance.now();
console.log(endJwt - startJwt);

const startJwtVal = performance.now();
const isValidToken = await verifyIdToken(token);
const endJwtVal = performance.now();
console.log(endJwtVal - startJwtVal);
console.log(isValidToken);
