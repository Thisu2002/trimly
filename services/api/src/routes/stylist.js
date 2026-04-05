"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../lib/auth");
const auth0Management_1 = require("../lib/auth0Management");
const router = (0, express_1.Router)();
router.post("/", async (req, res) => {
    try {
        const { idToken, name, email, phone, address, bio, yearsOfExperience, status, services, weeklyShifts, } = req.body;
        if (!idToken)
            return res.status(401).json({ error: "Missing token" });
        const payload = await (0, auth_1.verifyIdToken)(idToken);
        const sub = String(payload.sub);
        const admin = await prisma_1.prisma.user.findUnique({
            where: { auth0Sub: sub },
            include: { adminSalon: true },
        });
        if (!admin || admin.role !== "admin")
            return res.status(403).json({ error: "Not allowed" });
        if (!admin.adminSalon)
            return res.status(400).json({ error: "Create salon first" });
        const salonId = admin.adminSalon.id;
        const tempPassword = "Blah@123";
        const auth0User = await auth0Management_1.management.users.create({
            connection: "Username-Password-Authentication",
            email,
            name,
            password: tempPassword,
            email_verified: false,
            verify_email: false,
            app_metadata: {
                role: "stylist",
                salonId,
            },
        });
        if (!auth0User.user_id) {
            throw new Error("Auth0 user creation failed");
        }
        await fetch(`https://${process.env.AUTH0_DOMAIN}/dbconnections/change_password`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                client_id: process.env.AUTH0_CLIENT_ID,
                email,
                connection: "Username-Password-Authentication",
            }),
        });
        const user = await prisma_1.prisma.user.create({
            data: {
                auth0Sub: auth0User.user_id,
                name,
                email,
                phone,
                address,
                role: "stylist",
            },
        });
        const stylist = await prisma_1.prisma.stylist.create({
            data: {
                userId: user.id,
                salonId,
                bio,
                yearsOfExperience,
                status,
                services: {
                    create: (services ?? []).map((serviceId) => ({
                        serviceId,
                    })),
                },
                weeklyShifts: {
                    create: (weeklyShifts ?? []).map((shift) => ({
                        dayOfWeek: shift.dayOfWeek,
                        startTime: shift.startTime,
                        endTime: shift.endTime,
                        isOff: shift.isOff,
                    })),
                },
            },
        });
        res.json(stylist);
    }
    catch (err) {
        console.error(err);
        if (err?.statusCode === 409) {
            return res
                .status(409)
                .json({ error: "A user with this email already exists" });
        }
        const statusCode = err?.statusCode || 500;
        const message = err?.body?.message || err?.message || "Failed to create stylist";
        return res.status(statusCode).json({ error: message });
    }
});
router.get("/list", async (req, res) => {
    try {
        const idToken = String(req.query.idToken || "");
        if (!idToken) {
            return res.status(401).json({ error: "Missing token" });
        }
        const payload = await (0, auth_1.verifyIdToken)(idToken);
        const sub = String(payload.sub);
        const admin = await prisma_1.prisma.user.findUnique({
            where: { auth0Sub: sub },
            include: { adminSalon: true },
        });
        if (!admin || admin.role !== "admin") {
            return res.status(403).json({ error: "Not allowed" });
        }
        if (!admin.adminSalon) {
            return res.status(400).json({ error: "Create salon first" });
        }
        const stylists = await prisma_1.prisma.stylist.findMany({
            where: { salonId: admin.adminSalon.id },
            include: {
                user: true,
                services: {
                    include: {
                        service: true,
                    },
                },
                weeklyShifts: {
                    orderBy: {
                        dayOfWeek: "asc",
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        const formatted = stylists.map((stylist) => ({
            id: stylist.id,
            bio: stylist.bio,
            yearsOfExperience: stylist.yearsOfExperience,
            status: stylist.status,
            createdAt: stylist.createdAt,
            user: {
                id: stylist.user.id,
                name: stylist.user.name,
                email: stylist.user.email,
                phone: stylist.user.phone,
                address: stylist.user.address,
            },
            services: stylist.services.map((item) => ({
                id: item.service.id,
                name: item.service.name,
                durationMin: item.service.durationMin,
                priceLkr: item.service.priceLkr,
            })),
            weeklyShifts: stylist.weeklyShifts.map((shift) => ({
                dayOfWeek: shift.dayOfWeek,
                startTime: shift.startTime,
                endTime: shift.endTime,
                isOff: shift.isOff,
            })),
        }));
        return res.json(formatted);
    }
    catch (err) {
        console.error(err);
        return res
            .status(err?.statusCode || 500)
            .json({ error: err?.message || "Failed to fetch stylists" });
    }
});
router.get("/:id", async (req, res) => {
    try {
        const idToken = String(req.query.idToken || "");
        const stylistId = String(req.params.id);
        if (!idToken) {
            return res.status(401).json({ error: "Missing token" });
        }
        const payload = await (0, auth_1.verifyIdToken)(idToken);
        const sub = String(payload.sub);
        const admin = await prisma_1.prisma.user.findUnique({
            where: { auth0Sub: sub },
            include: { adminSalon: true },
        });
        if (!admin || admin.role !== "admin") {
            return res.status(403).json({ error: "Not allowed" });
        }
        if (!admin.adminSalon) {
            return res.status(400).json({ error: "Create salon first" });
        }
        const stylist = await prisma_1.prisma.stylist.findFirst({
            where: {
                id: stylistId,
                salonId: admin.adminSalon.id,
            },
            include: {
                user: true,
                services: {
                    include: {
                        service: true,
                    },
                },
                weeklyShifts: true,
            },
        });
        if (!stylist) {
            return res.status(404).json({ error: "Stylist not found" });
        }
        return res.json({
            id: stylist.id,
            bio: stylist.bio,
            yearsOfExperience: stylist.yearsOfExperience,
            status: stylist.status,
            user: {
                id: stylist.user.id,
                name: stylist.user.name,
                email: stylist.user.email,
                phone: stylist.user.phone,
                address: stylist.user.address,
            },
            services: stylist.services.map((item) => ({
                id: item.service.id,
                name: item.service.name,
            })),
            weeklyShifts: stylist.weeklyShifts.map((shift) => ({
                dayOfWeek: shift.dayOfWeek,
                startTime: shift.startTime,
                endTime: shift.endTime,
                isOff: shift.isOff,
            })),
        });
    }
    catch (err) {
        console.error(err);
        return res
            .status(err?.statusCode || 500)
            .json({ error: err?.message || "Failed to fetch stylist" });
    }
});
router.put("/:id", async (req, res) => {
    try {
        const stylistId = String(req.params.id);
        const { idToken, name, phone, address, bio, yearsOfExperience, status, services, weeklyShifts, } = req.body;
        if (!idToken) {
            return res.status(401).json({ error: "Missing token" });
        }
        const payload = await (0, auth_1.verifyIdToken)(idToken);
        const sub = String(payload.sub);
        const admin = await prisma_1.prisma.user.findUnique({
            where: { auth0Sub: sub },
            include: { adminSalon: true },
        });
        if (!admin || admin.role !== "admin") {
            return res.status(403).json({ error: "Not allowed" });
        }
        if (!admin.adminSalon) {
            return res.status(400).json({ error: "Create salon first" });
        }
        const existing = await prisma_1.prisma.stylist.findFirst({
            where: {
                id: stylistId,
                salonId: admin.adminSalon.id,
            },
            include: {
                user: true,
            },
        });
        if (!existing) {
            return res.status(404).json({ error: "Stylist not found" });
        }
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.user.update({
                where: { id: existing.userId },
                data: {
                    name,
                    phone,
                    address,
                },
            }),
            prisma_1.prisma.stylist.update({
                where: { id: stylistId },
                data: {
                    bio,
                    yearsOfExperience,
                    status,
                },
            }),
            prisma_1.prisma.stylistService.deleteMany({
                where: { stylistId },
            }),
            prisma_1.prisma.stylistService.createMany({
                data: (services ?? []).map((serviceId) => ({
                    stylistId,
                    serviceId,
                })),
            }),
            prisma_1.prisma.staffWeeklyShift.deleteMany({
                where: { stylistId },
            }),
            prisma_1.prisma.staffWeeklyShift.createMany({
                data: (weeklyShifts ?? []).map((shift) => ({
                    stylistId,
                    dayOfWeek: shift.dayOfWeek,
                    startTime: shift.startTime,
                    endTime: shift.endTime,
                    isOff: shift.isOff,
                })),
            }),
        ]);
        return res.json({ success: true });
    }
    catch (err) {
        console.error(err);
        return res
            .status(err?.statusCode || 500)
            .json({ error: err?.message || "Failed to update stylist" });
    }
});
exports.default = router;
