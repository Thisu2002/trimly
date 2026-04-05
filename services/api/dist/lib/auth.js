"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyIdToken = verifyIdToken;
const jose_1 = require("jose");
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const jwks = (0, jose_1.createRemoteJWKSet)(new URL(`https://${AUTH0_DOMAIN}/.well-known/jwks.json`));
async function verifyIdToken(idToken) {
    const { payload } = await (0, jose_1.jwtVerify)(idToken, jwks, {
        issuer: `https://${AUTH0_DOMAIN}/`,
        audience: process.env.AUTH0_CLIENT_ID,
    });
    console.log("Token payload:", payload);
    return payload;
}
