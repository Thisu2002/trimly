//D:\trimly\services\api\src\routes\stylistDashboard.ts
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { verifyIdToken } from "../lib/auth";
import multer from "multer";
import path from "path";
import fs from "fs";

const stylistPhotosDir = path.join(__dirname, "../../uploads/stylists");
if (!fs.existsSync(stylistPhotosDir)) {
  fs.mkdirSync(stylistPhotosDir, { recursive: true });
}

const stylistPhotoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, stylistPhotosDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const uploadStylistPhoto = multer({
  storage: stylistPhotoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

function removeStylistPhotoFile(photoUrl: string | null) {
  if (!photoUrl) return;
  const filename = photoUrl.split("/uploads/stylists/")[1];
  if (!filename) return;
  fs.unlink(path.join(stylistPhotosDir, filename), () => {});
}

const router = Router();

// Helper: resolve stylist from token
async function getStylistFromToken(idToken: string) {
  const payload = await verifyIdToken(idToken);
  const sub = String(payload.sub);

  const user = await prisma.user.findUnique({
    where: { auth0Sub: sub },
    include: {
      stylistProfile: {
        include: {
          salon: true,
        },
      },
    },
  });

  if (!user || user.role !== "stylist" || !user.stylistProfile) {
    return null;
  }

  return { user, stylist: user.stylistProfile };
}

// GET /api/stylist-dashboard/me
router.get("/me", async (req, res) => {
  try {
    const idToken = String(req.query.idToken || "");
    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const resolved = await getStylistFromToken(idToken);
    if (!resolved) return res.status(403).json({ error: "Not a stylist" });

    const { user, stylist } = resolved;

    const full = await prisma.stylist.findUnique({
      where: { id: stylist.id },
      include: {
        services: { include: { service: true } },
        weeklyShifts: { orderBy: { dayOfWeek: "asc" } },
        salon: true,
      },
    });

    if (!full) return res.status(404).json({ error: "Stylist not found" });

    return res.json({
      id: full.id,
      bio: full.bio,
      yearsOfExperience: full.yearsOfExperience,
      status: full.status,
      salon: {
        id: full.salon.id,
        name: full.salon.name,
        phone: full.salon.phone,
        address: full.salon.address,
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        photo: user.photo,
      },
      services: full.services.map((s) => ({
        id: s.service.id,
        name: s.service.name,
        durationMin: s.service.durationMin,
        priceLkr: s.service.priceLkr,
      })),
      weeklyShifts: full.weeklyShifts.map((sh) => ({
        dayOfWeek: sh.dayOfWeek,
        startTime: sh.startTime,
        endTime: sh.endTime,
        isOff: sh.isOff,
      })),
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// PUT /api/stylist-dashboard/me
router.put("/me", uploadStylistPhoto.single("photo"), async (req, res) => {
  try {
    const { idToken, name, phone, address, bio, yearsOfExperience, removePhoto } = req.body;
    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const resolved = await getStylistFromToken(idToken);
    if (!resolved) return res.status(403).json({ error: "Not a stylist" });

    const { user, stylist } = resolved;

    const apiBase = process.env.API_BASE_URL || "http://localhost:4000";
    const file = req.file as Express.Multer.File | undefined;

    let photoUpdate: { photo?: string | null } = {};

    if (file) {
      // New photo replaces any existing one
      removeStylistPhotoFile(user.photo);
      photoUpdate.photo = `${apiBase}/uploads/stylists/${file.filename}`;
    } else if (removePhoto === "true") {
      removeStylistPhotoFile(user.photo);
      photoUpdate.photo = null;
    }

    const yoe =
      yearsOfExperience === "" || yearsOfExperience === undefined
        ? null
        : Number(yearsOfExperience);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { name, phone, address, ...photoUpdate },
      }),
      prisma.stylist.update({
        where: { id: stylist.id },
        data: { bio, yearsOfExperience: yoe },
      }),
    ]);

    return res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

// GET /api/stylist-dashboard/appointments
router.get("/appointments", async (req, res) => {
  try {
    const idToken = String(req.query.idToken || "");
    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const resolved = await getStylistFromToken(idToken);
    if (!resolved) return res.status(403).json({ error: "Not a stylist" });

    const { stylist } = resolved;

    // Get all appointment services for this stylist, with parent appointment + customer
    const apptServices = await prisma.appointmentService.findMany({
      where: { stylistId: stylist.id },
      include: {
        service: true,
        appointment: {
          include: {
            customer: {
              include: { user: true },
            },
          },
        },
      },
      orderBy: [
        { appointment: { date: "desc" } },
        { startTime: "asc" },
      ],
    });

    // Group by appointment id
    const appointmentMap = new Map<string, any>();

    for (const as of apptServices) {
      const appt = as.appointment;
      const apptId = appt.id;

      if (!appointmentMap.has(apptId)) {
        appointmentMap.set(apptId, {
          id: apptId,
          date: appt.date,
          startTime: appt.startTime,
          endTime: appt.endTime,
          totalLkr: appt.totalLkr,
          status: appt.status,
          customer: {
            name: appt.customer.user.name,
            email: appt.customer.user.email,
            phone: appt.customer.user.phone,
          },
          myServices: [],
        });
      }

      appointmentMap.get(apptId).myServices.push({
        name: as.service.name,
        startTime: as.startTime,
        endTime: as.endTime,
        priceLkr: as.priceLkr,
        durationMin: as.durationMin,
      });
    }

    return res.json(Array.from(appointmentMap.values()));
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

// GET /api/stylist-dashboard/schedule
router.get("/schedule", async (req, res) => {
  try {
    const idToken = String(req.query.idToken || "");
    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const resolved = await getStylistFromToken(idToken);
    if (!resolved) return res.status(403).json({ error: "Not a stylist" });

    const { stylist } = resolved;

    const shifts = await prisma.staffWeeklyShift.findMany({
      where: { stylistId: stylist.id },
      orderBy: { dayOfWeek: "asc" },
    });

    // Today's services
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayServices = await prisma.appointmentService.findMany({
      where: {
        stylistId: stylist.id,
        appointment: {
          date: { gte: todayStart, lte: todayEnd },
          status: { in: ["confirmed", "pending"] },
        },
      },
      include: {
        service: true,
        appointment: {
          include: {
            customer: { include: { user: true } },
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    return res.json({
      weeklyShifts: shifts.map((sh) => ({
        dayOfWeek: sh.dayOfWeek,
        startTime: sh.startTime,
        endTime: sh.endTime,
        isOff: sh.isOff,
      })),
      todaySchedule: todayServices.map((as) => ({
        serviceName: as.service.name,
        startTime: as.startTime,
        endTime: as.endTime,
        customerName: as.appointment.customer.user.name,
        customerPhone: as.appointment.customer.user.phone,
        appointmentStatus: as.appointment.status,
      })),
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch schedule" });
  }
});

// GET /api/stylist-dashboard/calendar?month=YYYY-MM
router.get("/calendar", async (req, res) => {
  try {
    const idToken = String(req.query.idToken || "");
    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const resolved = await getStylistFromToken(idToken);
    if (!resolved) return res.status(403).json({ error: "Not a stylist" });

    const { stylist } = resolved;

    const monthParam = String(req.query.month || "");
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth(); // 0-indexed

    if (/^\d{4}-\d{2}$/.test(monthParam)) {
      const [y, m] = monthParam.split("-").map(Number);
      year = y;
      month = m - 1;
    }

    const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const apptServices = await prisma.appointmentService.findMany({
      where: {
        stylistId: stylist.id,
        appointment: {
          date: { gte: monthStart, lte: monthEnd },
        },
      },
      include: {
        service: true,
        appointment: {
          include: {
            customer: { include: { user: true } },
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    const appointmentsByDate: Record<string, any[]> = {};

    for (const as of apptServices) {
      // Normalize Prisma DateTime to a plain YYYY-MM-DD key
      const dateKey = as.appointment.date.toISOString().slice(0, 10);

      if (!appointmentsByDate[dateKey]) appointmentsByDate[dateKey] = [];

      appointmentsByDate[dateKey].push({
        id: as.id,
        serviceName: as.service.name,
        startTime: as.startTime,
        endTime: as.endTime,
        customerName: as.appointment.customer.user.name,
        customerPhone: as.appointment.customer.user.phone,
        appointmentStatus: as.appointment.status,
      });
    }

    return res.json({
      month: `${year}-${String(month + 1).padStart(2, "0")}`,
      appointmentsByDate,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch calendar" });
  }
});

// GET /api/stylist-dashboard/stats
router.get("/stats", async (req, res) => {
  try {
    const idToken = String(req.query.idToken || "");
    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const resolved = await getStylistFromToken(idToken);
    if (!resolved) return res.status(403).json({ error: "Not a stylist" });

    const { stylist } = resolved;

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // All appointment services for this stylist
    const all = await prisma.appointmentService.findMany({
      where: { stylistId: stylist.id },
      include: {
        appointment: true,
      },
    });

    const todayCount = all.filter((as) => {
      const d = new Date(as.appointment.date);
      return d >= todayStart && d <= todayEnd &&
        ["confirmed", "pending"].includes(as.appointment.status);
    }).length;

    const monthCompleted = all.filter((as) => {
      const d = new Date(as.appointment.date);
      return d >= monthStart && d <= monthEnd &&
        as.appointment.status === "completed";
    });

    const monthRevenue = monthCompleted.reduce((sum, as) => sum + as.priceLkr, 0);

    const totalCompleted = all.filter(
      (as) => as.appointment.status === "completed"
    ).length;

    // Upcoming (future confirmed/pending)
    const upcomingCount = all.filter((as) => {
      const d = new Date(as.appointment.date);
      return d > todayEnd && ["confirmed", "pending"].includes(as.appointment.status);
    }).length;

    return res.json({
      todayAppointments: todayCount,
      upcomingAppointments: upcomingCount,
      monthCompletedServices: monthCompleted.length,
      monthRevenueLkr: monthRevenue,
      totalCompletedServices: totalCompleted,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;