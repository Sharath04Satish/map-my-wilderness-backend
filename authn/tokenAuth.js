import { SignJWT, jwtVerify } from "jose";
import { publicKey, privateKey } from "./getKeyPair.js";
import dotenv from 'dotenv';

dotenv.config({ path: "../.env" });

export const generateIdToken = async (userName, userEmail) => {
    return await new SignJWT({ 'sub': userEmail, 'name': userName })
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
                        // Validate user from database.
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

const token = await generateIdToken("Sharath Satish", "sharaths1998@gmail.com");
const isValidToken = await verifyIdToken(token);
console.log(isValidToken);
