"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const booking_1 = require("../lib/booking");
const md5_1 = __importDefault(require("md5"));
const router = (0, express_1.Router)();
router.post("/notify", async (req, res) => {
    try {
        const { merchant_id, order_id, payment_id, payhere_amount, payhere_currency, status_code, md5sig, } = req.body;
        const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
        const hashedSecret = (0, md5_1.default)(merchantSecret).toUpperCase();
        const expectedSig = (0, md5_1.default)(merchant_id + order_id + payhere_amount + payhere_currency + status_code + hashedSecret).toUpperCase();
        if (md5sig !== expectedSig) {
            console.warn("PayHere notify: invalid signature", { md5sig, expectedSig });
            return res.sendStatus(400);
        }
        const pending = await prisma_1.prisma.pendingPayment.findUnique({
            where: { id: order_id },
            include: { user: true },
        });
        if (!pending) {
            console.warn("PayHere notify: unknown order_id", order_id);
            return res.sendStatus(404);
        }
        if (status_code === "2") {
            const snapshot = JSON.parse(pending.bookingSnapshot);
            const { serviceAssignments, segments } = snapshot;
            const services = await prisma_1.prisma.service.findMany({
                where: { id: { in: serviceAssignments.map((x) => x.serviceId) } },
            });
            const serviceMap = new Map(services.map((s) => [s.id, s]));
            const customer = await prisma_1.prisma.customer.findUnique({
                where: { userId: pending.userId },
            });
            if (!customer) {
                console.error("PayHere notify: customer not found for user", pending.userId);
                return res.sendStatus(500);
            }
            const appointmentEndTime = segments[segments.length - 1].endTime;
            for (const item of serviceAssignments) {
                const segment = segments.find((s) => s.serviceId === item.serviceId && s.sequence === item.sequence);
                const conflict = await prisma_1.prisma.appointmentService.findFirst({
                    where: {
                        stylistId: item.stylistId,
                        appointment: {
                            date: pending.date,
                            status: { in: ["pending", "confirmed"] },
                        },
                    },
                    include: { appointment: true },
                });
                if (conflict &&
                    (0, booking_1.overlaps)(segment.startTime, segment.endTime, conflict.startTime, conflict.endTime)) {
                    await prisma_1.prisma.pendingPayment.update({
                        where: { id: order_id },
                        data: { failed: true },
                    });
                    console.error("PayHere notify: stylist conflict detected after payment for order", order_id);
                    return res.sendStatus(200);
                }
            }
            await prisma_1.prisma.$transaction(async (tx) => {
                const appointment = await tx.appointment.create({
                    data: {
                        customerId: customer.id,
                        salonId: pending.salonId,
                        date: pending.date,
                        startTime: pending.startTime,
                        endTime: appointmentEndTime,
                        totalLkr: pending.totalLkr,
                        status: "confirmed",
                        services: {
                            create: serviceAssignments.map((item) => {
                                const service = serviceMap.get(item.serviceId);
                                const segment = segments.find((s) => s.serviceId === item.serviceId && s.sequence === item.sequence);
                                return {
                                    serviceId: item.serviceId,
                                    stylistId: item.stylistId,
                                    sequence: item.sequence,
                                    startTime: segment.startTime,
                                    endTime: segment.endTime,
                                    priceLkr: service.priceLkr,
                                    durationMin: service.durationMin,
                                };
                            }),
                        },
                    },
                });
                await tx.payment.create({
                    data: {
                        appointmentId: appointment.id,
                        amountLkr: pending.totalLkr,
                        status: "paid",
                        method: "payhere",
                        payherePaymentId: payment_id,
                    },
                });
                await tx.pendingPayment.update({
                    where: { id: order_id },
                    data: { appointmentId: appointment.id },
                });
            });
            console.log("PayHere notify: appointment created for order", order_id);
        }
        else {
            await prisma_1.prisma.pendingPayment.update({
                where: { id: order_id },
                data: { failed: true },
            });
            console.log(`PayHere notify: payment not successful (status ${status_code}) for order`, order_id);
        }
        return res.sendStatus(200);
    }
    catch (err) {
        console.error("PayHere notify error:", err);
        return res.sendStatus(500);
    }
});
exports.default = router;
