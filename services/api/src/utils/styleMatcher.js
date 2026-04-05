"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectStyleId = detectStyleId;
const prisma_1 = require("../lib/prisma");
async function detectStyleId(serviceName) {
    const name = serviceName.toLowerCase();
    const styles = await prisma_1.prisma.style.findMany();
    for (const style of styles) {
        if (name.includes(style.name.toLowerCase())) {
            return style.id;
        }
    }
    // manual keyword matching
    if (name.includes("bob")) {
        const style = await prisma_1.prisma.style.findFirst({ where: { name: "Layered Bob" } });
        return style?.id;
    }
    if (name.includes("balayage")) {
        const style = await prisma_1.prisma.style.findFirst({ where: { name: "Balayage" } });
        return style?.id;
    }
    if (name.includes("keratin")) {
        const style = await prisma_1.prisma.style.findFirst({ where: { name: "Keratin Treatment" } });
        return style?.id;
    }
    if (name.includes("spa")) {
        const style = await prisma_1.prisma.style.findFirst({ where: { name: "Hair Spa" } });
        return style?.id;
    }
    return null;
}
