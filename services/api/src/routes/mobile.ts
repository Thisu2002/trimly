//D:\trimly\services\api\src\routes\mobile.ts
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";
import { verifyIdToken } from "../lib/auth";
import {
  buildServiceSegments,
  generateSlots,
  getDayOfWeek,
  overlaps,
  toDateOnly,
} from "../utils/booking";
import md5 from "md5";

const router = Router();

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.get("/salons", async (req, res) => {
  try {
    const q         = String(req.query.q         || "").trim();
    const sortBy    = String(req.query.sortBy    || "newest") as "nearest" | "rating" | "newest";
    const minRating = parseFloat(String(req.query.minRating || "0"));
    const userLat   = req.query.lat ? parseFloat(String(req.query.lat)) : null;
    const userLng   = req.query.lng ? parseFloat(String(req.query.lng)) : null;
    const radiusKm  = req.query.radiusKm ? parseFloat(String(req.query.radiusKm)) : 50;
    const page      = Math.max(1, parseInt(String(req.query.page  || "1"),  10));
    const limit     = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "20"), 10)));
    const skip      = (page - 1) * limit;
 
    const where: Prisma.SalonWhereInput = {};
 
    if (q) {
      where.OR = [
        { name:    { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
      ];
    }
 
    if (minRating > 0) {
      where.avgRating = { gte: minRating };
    }
 
    const orderBy: Prisma.SalonOrderByWithRelationInput =
      sortBy === "rating"
        ? { avgRating: "desc" }
        : { createdAt: "desc" };

    const fetchAll = sortBy === "nearest" && userLat !== null && userLng !== null;
 
    const salons = await prisma.salon.findMany({
      where,
      include: {
        services: { select: { id: true } },
        stylists: { select: { id: true } },
      },
      orderBy,
      ...(fetchAll ? {} : { skip, take: limit }),
    });
 
    type SalonRow = (typeof salons)[number];
 
    const mapped = salons.map((salon: SalonRow) => {
      const distanceKm =
        userLat !== null &&
        userLng !== null &&
        salon.latitude != null &&
        salon.longitude != null
          ? parseFloat(
              haversineKm(userLat, userLng, salon.latitude, salon.longitude).toFixed(1),
            )
          : null;
 
      return {
        id:           salon.id,
        name:         salon.name,
        address:      salon.address,
        phone:        salon.phone,
        rating:       parseFloat((salon.avgRating ?? 0).toFixed(1)),
        serviceCount: salon.services.length,
        stylistCount: salon.stylists.length,
        photos:       salon.photos || [],
        distanceKm,
        latitude:     salon.latitude,
        longitude:    salon.longitude,
      };
    });
 
    let result = mapped;
 
    if (fetchAll) {
      result = mapped
        .filter((s) => s.distanceKm === null || s.distanceKm <= radiusKm)
        .sort((a, b) => {
          if (a.distanceKm === null) return 1;
          if (b.distanceKm === null) return -1;
          return a.distanceKm - b.distanceKm;
        })
        .slice(skip, skip + limit);
    }
 
    const total = fetchAll
      ? mapped.filter((s) => s.distanceKm === null || s.distanceKm <= radiusKm).length
      : await prisma.salon.count({ where });
 
    return res.json({
      salons: result,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get salons error:", error);
    return res.status(500).json({ error: "Failed to fetch salons" });
  }
});

router.get("/salons/:salonId", async (req, res) => {
  try {
    const { salonId } = req.params;

    const [salon, ratingAgg, recentReviews] = await Promise.all([
      prisma.salon.findUnique({
        where: { id: salonId },
        include: {
          businessHours: true,
          categories: {
            include: { services: true },
            orderBy: { name: "asc" },
          },
          stylists: {
            include: {
              user: true,
              services: {
                include: { service: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      }),
      prisma.appointmentReview.aggregate({
        where: { salonId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      prisma.appointmentReview.findMany({
        where: { salonId },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          customer: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    if (!salon) {
      return res.status(404).json({ error: "Salon not found" });
    }

    return res.json({
      salon: {
        id: salon.id,
        name: salon.name,
        address: salon.address,
        phone: salon.phone,
        about: salon.about,
        rating: ratingAgg._avg.rating
          ? parseFloat(ratingAgg._avg.rating.toFixed(1))
          : 0,
        reviewCount: ratingAgg._count.rating,
        photoSlots: 3,
        photos: salon.photos || [],
        businessHours: salon.businessHours,
        categories: salon.categories,
        reviews: recentReviews.map((r) => ({
          id: r.id,
          customerName: r.customer.user.name ?? "Anonymous",
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
        })),
        stylists: salon.stylists.map((stylist) => ({
          id: stylist.id,
          name: stylist.user.name || stylist.user.email,
          bio: stylist.bio,
          yearsOfExperience: stylist.yearsOfExperience,
          status: stylist.status,
          services: stylist.services.map((x) => ({
            id: x.service.id,
            name: x.service.name,
          })),
        })),
      },
    });
  } catch (error) {
    console.error("Get salon detail error:", error);
    return res.status(500).json({ error: "Failed to fetch salon details" });
  }
});

router.post("/slots", async (req, res) => {
  try {
    const { salonId, date } = req.body as {
      salonId?: string;
      date?: string;
    };

    if (!salonId || !date) {
      return res.status(400).json({ error: "salonId and date are required" });
    }

    const dayOfWeek = getDayOfWeek(date);

    const hours = await prisma.salonBusinessHour.findUnique({
      where: {
        salonId_dayOfWeek: {
          salonId,
          dayOfWeek,
        },
      },
    });

    if (!hours || hours.isClosed) {
      return res.json({ slots: [] });
    }

    const rawSlots = generateSlots(
      hours.openTime,
      hours.closeTime,
      hours.slotDuration,
    );

    const now = new Date();

    // local yyyy-mm-dd
    const today =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0");

    let filteredSlots = rawSlots;

    if (date === today) {
      const currentMinutes =
        now.getHours() * 60 + now.getMinutes();

      filteredSlots = rawSlots.filter((slot) => {
        // slot format example: "14:30"

        const [hours, minutes] = slot
          .split(":")
          .map(Number);

        const slotMinutes = hours * 60 + minutes;

        // optional 5 min buffer
        return slotMinutes > currentMinutes + 5;
      });
    }

    const slots = filteredSlots.map((startTime) => ({
      startTime,
      endTime: startTime,
      disabled: false,
      salonBusy: false,
    }));

    // const slots = rawSlots.map((startTime) => ({
    //   startTime,
    //   endTime: startTime,
    //   disabled: false,
    //   salonBusy: false,
    // }));

    return res.json({
      slotDuration: hours.slotDuration,
      slots,
    });
  } catch (error) {
    console.error("Get slots error:", error);
    return res.status(500).json({ error: "Failed to generate slots" });
  }
});

router.post("/stylists/available", async (req, res) => {
  try {
    const { salonId, date, startTime, selectedServices } = req.body as {
      salonId?: string;
      date?: string;
      startTime?: string;
      selectedServices?: { serviceId: string; sequence: number }[];
    };

    if (!salonId || !date || !startTime || !selectedServices?.length) {
      return res.status(400).json({
        error: "salonId, date, startTime and selectedServices are required",
      });
    }

    const dayOfWeek = getDayOfWeek(date);

    const services = await prisma.service.findMany({
      where: {
        id: { in: selectedServices.map((s) => s.serviceId) },
        salonId,
      },
    });

    const serviceMap = new Map(services.map((s) => [s.id, s]));

    const orderedForSegments = selectedServices.map((item) => {
      const service = serviceMap.get(item.serviceId);
      if (!service) {
        throw new Error(`Invalid service ${item.serviceId}`);
      }

      return {
        serviceId: item.serviceId,
        sequence: item.sequence,
        durationMin: service.durationMin,
      };
    });

    const segments = buildServiceSegments(startTime, orderedForSegments);

    const stylists = await prisma.stylist.findMany({
      where: { salonId, status: "on_duty" },
      include: {
        user: true,
        weeklyShifts: true,
        services: true,
        appointmentServices: {
          include: {
            appointment: true,
          },
        },
      },
    });

    const result = segments.map((segment) => {
      const service = serviceMap.get(segment.serviceId)!;

      const availableStylists = stylists.filter((stylist) => {
        const canDoService = stylist.services.some(
          (s) => s.serviceId === service.id,
        );
        if (!canDoService) return false;

        const shift = stylist.weeklyShifts.find(
          (x) => x.dayOfWeek === dayOfWeek && !x.isOff,
        );
        if (!shift) return false;

        const withinShift =
          shift.startTime <= segment.startTime &&
          shift.endTime >= segment.endTime;

        if (!withinShift) return false;

        const hasOverlap = stylist.appointmentServices.some((as) => {
          const appt = as.appointment;
          const sameDate =
            new Date(appt.date).toISOString().slice(0, 10) ===
            toDateOnly(date).toISOString().slice(0, 10);

          if (!sameDate) return false;
          if (!["pending", "confirmed"].includes(appt.status)) return false;

          return overlaps(
            segment.startTime,
            segment.endTime,
            as.startTime,
            as.endTime,
          );
        });

        return !hasOverlap;
      });

      return {
        serviceId: service.id,
        serviceName: service.name,
        sequence: segment.sequence,
        serviceStartTime: segment.startTime,
        serviceEndTime: segment.endTime,
        stylists: availableStylists.map((stylist) => ({
          id: stylist.id,
          name: stylist.user.name || stylist.user.email,
          yearsOfExperience: stylist.yearsOfExperience,
          bio: stylist.bio,
        })),
      };
    });

    return res.json({ items: result });
  } catch (error) {
    console.error("Available stylists error:", error);
    return res.status(500).json({ error: "Failed to fetch stylists" });
  }
});

router.post("/initiate-payment", async (req, res) => {
  try {
    const { idToken, salonId, date, startTime, serviceAssignments } =
      req.body as {
        idToken?: string;
        salonId?: string;
        date?: string;
        startTime?: string;
        serviceAssignments?: {
          serviceId: string;
          stylistId: string;
          sequence: number;
        }[];
      };

    if (
      !idToken ||
      !salonId ||
      !date ||
      !startTime ||
      !serviceAssignments?.length
    ) {
      return res.status(400).json({
        error:
          "idToken, salonId, date, startTime and serviceAssignments are required",
      });
    }

    const payload = await verifyIdToken(idToken);
    const sub = String(payload.sub);
    const email = payload.email as string | undefined;

    if (!email) {
      return res.status(400).json({ error: "email missing in token" });
    }

    const user = await prisma.user.findUnique({
      where: { auth0Sub: sub },
    });

    if (!user) {
      return res
        .status(404)
        .json({ error: "User not found. Please log in again." });
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: user.id },
    });

    if (!customer) {
      return res.status(500).json({ error: "Customer profile missing" });
    }
    const services = await prisma.service.findMany({
      where: {
        id: { in: serviceAssignments.map((x) => x.serviceId) },
        salonId,
      },
    });

    if (services.length !== serviceAssignments.length) {
      return res
        .status(400)
        .json({ error: "Some selected services are invalid" });
    }

    const serviceMap = new Map(services.map((s) => [s.id, s]));
    const totalLkr = services.reduce((sum, s) => sum + s.priceLkr, 0);

    const orderedForSegments = serviceAssignments.map((item) => {
      const service = serviceMap.get(item.serviceId)!;
      return {
        serviceId: item.serviceId,
        sequence: item.sequence,
        durationMin: service.durationMin,
      };
    });

    const segments = buildServiceSegments(startTime, orderedForSegments);

    for (const item of serviceAssignments) {
      const segment = segments.find(
        (s) => s.serviceId === item.serviceId && s.sequence === item.sequence,
      )!;

      const conflict = await prisma.appointmentService.findFirst({
        where: {
          stylistId: item.stylistId,
          appointment: {
            date: toDateOnly(date),
            status: { in: ["pending", "confirmed"] },
          },
        },
        include: { appointment: true },
      });

      if (
        conflict &&
        overlaps(
          segment.startTime,
          segment.endTime,
          conflict.startTime,
          conflict.endTime,
        )
      ) {
        return res.status(400).json({
          error: "A selected stylist is no longer available",
        });
      }
    }

    const pendingPayment = await prisma.pendingPayment.create({
      data: {
        customerId: customer.id,
        salonId,
        date: toDateOnly(date),
        startTime,
        totalLkr,
        bookingSnapshot: JSON.stringify({
          serviceAssignments,
          segments: segments.map((s) => s),
        }),
      },
    });

    const merchantId = process.env.PAYHERE_MERCHANT_ID!;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET!;

    const hashedSecret = md5(merchantSecret).toUpperCase();
    const amountFormatted = parseFloat(totalLkr.toString()).toFixed(2);
    const hash = md5(
      merchantId + pendingPayment.id + amountFormatted + "LKR" + hashedSecret,
    ).toUpperCase();

    const notifyUrl = process.env.PAYHERE_NOTIFY_URL;

    const paymentData = {
      sandbox: true,
      merchant_id: merchantId,
      notify_url: notifyUrl,
      order_id: pendingPayment.id,
      items: "Salon Booking",
      amount: amountFormatted,
      currency: "LKR",
      first_name: user.name || "Guest",
      last_name: "User",
      email: email,
      phone: user.phone || "",
      address: user.address || "",
      city: "Colombo",
      country: "Sri Lanka",
      hash,
    };

    console.log("Payment Data:", paymentData);

    return res.json({
      pendingPaymentId: pendingPayment.id,
      paymentData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to initiate payment" });
  }
});

router.get("/payment-status/:pendingPaymentId", async (req, res) => {
  try {
    const { pendingPaymentId } = req.params;
    console.log("Checking payment status for:", pendingPaymentId);

    const pending = await prisma.pendingPayment.findUnique({
      where: { id: pendingPaymentId },
      include: { appointment: true },
    });
    console.log("Pending payment record:", pending);

    if (!pending) {
      return res.status(404).json({ error: "Payment not found" });
    }

    if (pending.appointment) {
      return res.json({
        status: "confirmed",
        appointmentId: pending.appointment.id,
      });
    }

    if (pending.failed) {
      return res.json({ status: "failed" });
    }

    return res.json({ status: "pending" });
  } catch (error) {
    console.error("Payment status error:", error);
    return res.status(500).json({ error: "Failed to check payment status" });
  }
});

export default router;
