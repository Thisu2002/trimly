"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../lib/auth");
const router = (0, express_1.Router)();
router.post("/", async (req, res) => {
    try {
        const { idToken, name, phone, address } = req.body;
        if (!idToken)
            return res.status(401).json({ error: "Missing token" });
        const payload = await (0, auth_1.verifyIdToken)(idToken);
        const sub = String(payload.sub);
        const user = await prisma_1.prisma.user.findUnique({
            where: { auth0Sub: sub },
            include: { adminSalon: true },
        });
        if (!user)
            return res.status(404).json({ error: "User not found" });
        if (user.role !== "admin")
            return res.status(403).json({ error: "Not an admin" });
        if (user.adminSalon) {
            return res.status(400).json({ error: "Salon already exists" });
        }
        const salon = await prisma_1.prisma.salon.create({
            data: { name, phone, address, adminUserId: user.id },
        });
        res.json(salon);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create salon" });
    }
});
exports.default = router;
