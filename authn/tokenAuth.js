import * as jose from 'jose';
import { publicKey, privateKey } from "./getKeyPair.js";

const alg = "PS256";

export const getJwt = async (userName, userEmail) => {
    return await new jose.SignJWT({ 'sub': userEmail, 'name': userName })
        .setProtectedHeader({ alg: alg, typ: 'JWT' })
        .setIssuedAt()
        .setIssuer('map-my-wilderness-auth')
        .setAudience('map-my-wilderness-api')
        .setExpirationTime('1h')
        .sign(privateKey)
}

const jwt = await getJwt("Sharath", "sharaths1998@gmail.com")

try {
    const { payload, protectedHeader } = await jose.jwtVerify(jwt, publicKey, {
        issuer: 'map-my-wilderness-auth',
        audience: 'map-my-wilderness-api'
    });

    console.log(payload);
    console.log(protectedHeader);
} catch (ex) {
    console.log(ex);
}
