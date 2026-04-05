"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
router.post("/style", async (req, res) => {
    try {
        const { faceShape, hairType, hairLength, styleGoal, previousServices, } = req.body;
        const aiRes = await fetch("http://localhost:8000/recommendations/style", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                faceShape,
                hairType,
                hairLength,
                styleGoal,
                previousServices: previousServices ?? [],
            }),
        });
        const aiData = await aiRes.json();
        const styleNames = aiData.recommendations.flatMap((r) => r.recommendedStyles);
        const styles = await prisma_1.prisma.style.findMany({
            where: {
                name: {
                    in: styleNames,
                    mode: "insensitive",
                },
            },
        });
        const styleIds = styles.map((s) => s.id);
        const services = await prisma_1.prisma.service.findMany({
            where: {
                styleId: { in: styleIds },
            },
            include: {
                category: {
                    select: { name: true },
                },
                salon: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        phone: true,
                    },
                },
                style: {
                    select: { name: true },
                },
            },
        });
        const servicesByStyle = {};
        for (const svc of services) {
            const styleName = svc.style?.name ?? "Unknown";
            if (!servicesByStyle[styleName])
                servicesByStyle[styleName] = [];
            servicesByStyle[styleName].push(svc);
        }
        return res.json({
            ai: aiData,
            matchedServices: services,
            servicesByStyle,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Recommendation failed" });
    }
});
exports.default = router;
