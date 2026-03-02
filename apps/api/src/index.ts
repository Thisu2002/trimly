import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma";
import { verifyIdToken } from "./lib/auth";
import salonRoutes from "./routes/salon";
import serviceRoutes from "./routes/service";
import stylistRoutes from "./routes/stylist";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "https://your-vercel-app.vercel.app"],
    credentials: true,
  })
);

app.use(express.json());
app.use("/api/salon", salonRoutes);
app.use("/api/service", serviceRoutes);
app.use("/api/stylist", stylistRoutes);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/auth/me", async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: "idToken required" });

    const payload = await verifyIdToken(idToken);

    const sub = String(payload.sub);
    const email = payload.email as string | undefined;

    if (!email)
      return res.status(400).json({ error: "email missing in token" });

    const userName =
      typeof payload.name === "string" ? payload.name : email.split("@")[0];

    const rawRoles = payload["https://trimly.app/roles"];
    const authRoles = Array.isArray(rawRoles) ? rawRoles.map(String) : [];

    const role: "admin" | "customer" = authRoles.includes("admin")
      ? "admin"
      : "customer";

    let user = await prisma.user.findUnique({
      where: { auth0Sub: sub },
      include: { adminSalon: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { auth0Sub: sub, email, role, name: userName },
        include: { adminSalon: true },
      });
    }

    return res.json({ user });
  } catch (e) {
    console.error("Auth error:", e);
    return res.status(401).json({ error: "Invalid token" });
  }
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () =>
  console.log(`API listening on http://localhost:${port}`)
);