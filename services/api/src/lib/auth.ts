import { createRemoteJWKSet, jwtVerify } from "jose";

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN!;

const jwks = createRemoteJWKSet(
  new URL(`https://${AUTH0_DOMAIN}/.well-known/jwks.json`)
);

export async function verifyIdToken(idToken: string) {
  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: `https://${AUTH0_DOMAIN}/`,
    audience: process.env.AUTH0_CLIENT_ID,
  });
  console.log("Token payload:", payload);

  return payload;
}