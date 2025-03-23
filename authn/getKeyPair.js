import fs from 'fs';
import { importSPKI, importPKCS8 } from 'jose';
import dotenv from 'dotenv';

dotenv.config({ path: "../.env" });

const privatePem = fs.readFileSync(`${process.env.PRIVATE_KEY_PATH}`, 'utf8');
const publicPem = fs.readFileSync(`${process.env.PUBLIC_KEY_PATH}`, 'utf8');

export const privateKey = await importPKCS8(privatePem, `${process.env.PRIVATE_KEY_ALGORITHM}`);
export const publicKey = await importSPKI(publicPem, `${process.env.PUBLIC_KEY_ALGORITHM}`);
