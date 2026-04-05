"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const prisma_1 = require("./lib/prisma");
const auth_1 = require("./lib/auth");
const salon_1 = __importDefault(require("./routes/salon"));
const service_1 = __importDefault(require("./routes/service"));
const stylist_1 = __importDefault(require("./routes/stylist"));
const salonHours_1 = __importDefault(require("./routes/salonHours"));
const auth_2 = __importDefault(require("./routes/auth"));
const mobile_1 = __importDefault(require("./routes/mobile"));
const recommendation_1 = __importDefault(require("./routes/recommendation"));
const appointment_1 = __importDefault(require("./routes/appointment"));
const payment_1 = __importDefault(require("./routes/payment"));
const hairProfile_1 = __importDefault(require("./routes/hairProfile"));
const app = (0, express_1.default)();
// app.use(
//   cors({
//     origin: ["http://localhost:3000", "https://your-vercel-app.vercel.app"],
//     credentials: true,
//   })
// );
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
}));
app.use((req, res, next) => {
    console.log(`→ ${req.method} ${req.path}`);
    next();
});
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/api/salon", salon_1.default);
app.use("/api/service", service_1.default);
app.use("/api/stylist", stylist_1.default);
app.use("/api/salon-hours", salonHours_1.default);
app.use("/api/auth", auth_2.default);
app.use("/api/mobile", mobile_1.default);
app.use("/recommendation", recommendation_1.default);
app.use("/api/appointment", appointment_1.default);
app.use("/api/payment", payment_1.default);
app.use("/api/hair-profile", hairProfile_1.default);
app.get("/health", (_req, res) => res.json({ ok: true }));
app.post("/auth/me", async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken)
            return res.status(400).json({ error: "idToken required" });
        const payload = await (0, auth_1.verifyIdToken)(idToken);
        const sub = String(payload.sub);
        const email = payload.email;
        if (!email)
            return res.status(400).json({ error: "email missing in token" });
        const userName = typeof payload.name === "string" ? payload.name : email.split("@")[0];
        const rawRoles = payload["https://trimly.app/roles"];
        const authRoles = Array.isArray(rawRoles) ? rawRoles.map(String) : [];
        const role = authRoles.includes("admin")
            ? "admin"
            : "customer";
        let user = await prisma_1.prisma.user.findUnique({
            where: { auth0Sub: sub },
            include: { adminSalon: true },
        });
        if (!user) {
            user = await prisma_1.prisma.user.create({
                data: { auth0Sub: sub, email, role, name: userName },
                include: { adminSalon: true },
            });
        }
        return res.json({ user });
    }
    catch (e) {
        console.error("Auth error:", e);
        return res.status(401).json({ error: "Invalid token" });
    }
});
// const port = Number(process.env.PORT || 4000);
// app.listen(port, () =>
//   console.log(`API listening on http://localhost:${port}`)
// );
const port = Number(process.env.PORT || 4000);
app.listen(port, "0.0.0.0", () => console.log(`API listening on http://0.0.0.0:${port}`));
