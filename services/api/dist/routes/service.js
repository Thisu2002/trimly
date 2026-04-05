"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../lib/auth");
const styleMatcher_1 = require("../utils/styleMatcher");
const router = (0, express_1.Router)();
router.post("/", async (req, res) => {
    try {
        const { idToken, name, description, durationMin, priceLkr, categoryId, newCategoryName, newCategoryDescription, } = req.body;
        if (!idToken)
            return res.status(401).json({ error: "Missing token" });
        const payload = await (0, auth_1.verifyIdToken)(idToken);
        const sub = String(payload.sub);
        const user = await prisma_1.prisma.user.findUnique({
            where: { auth0Sub: sub },
            include: { adminSalon: true },
        });
        if (!user || user.role !== "admin")
            return res.status(403).json({ error: "Not allowed" });
        if (!user.adminSalon)
            return res.status(400).json({ error: "Create salon first" });
        let finalCategoryId = categoryId;
        if (!finalCategoryId && newCategoryName) {
            const newCategory = await prisma_1.prisma.category.create({
                data: {
                    name: newCategoryName,
                    description: newCategoryDescription,
                    salonId: user.adminSalon.id,
                },
            });
            finalCategoryId = newCategory.id;
        }
        const detectedStyleId = await (0, styleMatcher_1.detectStyleId)(name);
        const service = await prisma_1.prisma.service.create({
            data: {
                name,
                description,
                durationMin,
                priceLkr,
                salonId: user.adminSalon.id,
                categoryId: finalCategoryId || null,
                styleId: detectedStyleId,
            },
        });
        res.json({ service, createdCategoryId: finalCategoryId });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create service" });
    }
});
router.get("/categories", async (req, res) => {
    try {
        const { idToken } = req.query;
        if (!idToken)
            return res.status(401).json({ error: "Missing token" });
        const payload = await (0, auth_1.verifyIdToken)(String(idToken));
        const sub = String(payload.sub);
        const user = await prisma_1.prisma.user.findUnique({
            where: { auth0Sub: sub },
            include: { adminSalon: true },
        });
        if (!user?.adminSalon)
            return res.status(400).json({ error: "No salon" });
        const categories = await prisma_1.prisma.category.findMany({
            where: { salonId: user.adminSalon.id },
            orderBy: { name: "asc" },
        });
        res.json(categories);
    }
    catch (e) {
        res.status(500).json({ error: "Failed to fetch categories" });
    }
});
router.get("/list", async (req, res) => {
    try {
        const { idToken } = req.query;
        if (!idToken)
            return res.status(401).json({ error: "Missing token" });
        const payload = await (0, auth_1.verifyIdToken)(String(idToken));
        const sub = String(payload.sub);
        const user = await prisma_1.prisma.user.findUnique({
            where: { auth0Sub: sub },
            include: { adminSalon: true },
        });
        if (!user?.adminSalon) {
            return res.status(400).json({ error: "No salon" });
        }
        const services = await prisma_1.prisma.service.findMany({
            where: { salonId: user.adminSalon.id },
            include: {
                category: true,
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(services);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch services" });
    }
});
exports.default = router;
