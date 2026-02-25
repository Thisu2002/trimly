import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const prisma = new PrismaClient();

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN!;

const jwks = createRemoteJWKSet(
  new URL(`https://${AUTH0_DOMAIN}/.well-known/jwks.json`),
);

async function verifyIdToken(idToken: string) {
  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: `https://${AUTH0_DOMAIN}/`,
    audience: process.env.AUTH0_CLIENT_ID,
  });

  return payload;
}

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/auth/me", async (req, res) => {
  try {
    const { idToken } = req.body as { idToken?: string };
    if (!idToken) return res.status(400).json({ error: "idToken required" });

    const payload = await verifyIdToken(idToken);

    const sub = String(payload.sub);
    const email = payload.email ? String(payload.email) : undefined;
    if (!email)
      return res
        .status(400)
        .json({ error: "email missing in token (request email scope)" });

    const rawRoles = payload["https://trimly.app/roles"];

    const authRoles = Array.isArray(rawRoles) ? rawRoles.map(String) : [];

    const role: "admin" | "customer" =
      authRoles.includes("admin") ? "admin" : "customer";

    let user = await prisma.user.findUnique({
      where: { auth0Sub: sub },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { auth0Sub: sub, email, role },
      });
    }

    return res.json({ user });
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () =>
  console.log(`API listening on http://localhost:${port}`),
);
