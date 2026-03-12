import { Router } from "express";
import { prisma } from "../lib/prisma";
import { verifyIdToken } from "../lib/auth";

const router = Router();

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type DayOfWeek = (typeof DAYS)[number];

type HourInput = {
  dayOfWeek: DayOfWeek;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
};

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

router.post("/get", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(401).json({ error: "Missing token" });
    }

    const payload = await verifyIdToken(idToken);
    const sub = String(payload.sub);

    const user = await prisma.user.findUnique({
      where: { auth0Sub: sub },
      include: {
        adminSalon: {
          include: {
            businessHours: {
              orderBy: { dayOfWeek: "asc" },
            },
          },
        },
      },
    });

    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Not allowed" });
    }

    if (!user.adminSalon) {
      return res.status(400).json({ error: "Create salon first" });
    }

    const existing = user.adminSalon.businessHours;
    //console.log("Existing hours for", user.adminSalon.name, ":", existing);

    const result = DAYS.map((day) => {
      const row = existing.find((h) => h.dayOfWeek === day);
      return (
        row ?? {
          dayOfWeek: day,
          openTime: "09:00",
          closeTime: "18:00",
          isClosed: false,
        }
      );
    });
    //console.log("Salon hours for", user.adminSalon.name, ":", result);

    return res.json({
      salonId: user.adminSalon.id,
      hours: result,
    });
  } catch (error) {
    console.error("GET salon hours error:", error);
    return res.status(500).json({ error: "Failed to fetch salon hours" });
  }
});

router.put("/", async (req, res) => {
  try {
    const { idToken, hours } = req.body as {
      idToken?: string;
      hours?: HourInput[];
    };

    if (!idToken) {
      return res.status(401).json({ error: "Missing token" });
    }

    if (!Array.isArray(hours) || hours.length !== 7) {
      return res.status(400).json({ error: "Hours must contain 7 days" });
    }

    const payload = await verifyIdToken(idToken);
    const sub = String(payload.sub);

    const user = await prisma.user.findUnique({
      where: { auth0Sub: sub },
      include: { adminSalon: true },
    });

    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Not allowed" });
    }

    if (!user.adminSalon) {
      return res.status(400).json({ error: "Create salon first" });
    }

    const seen = new Set<string>();

    for (const item of hours) {
      if (!DAYS.includes(item.dayOfWeek)) {
        return res.status(400).json({ error: `Invalid day: ${item.dayOfWeek}` });
      }

      if (seen.has(item.dayOfWeek)) {
        return res.status(400).json({ error: `Duplicate day: ${item.dayOfWeek}` });
      }
      seen.add(item.dayOfWeek);

      if (!item.isClosed) {
        if (!isValidTime(item.openTime) || !isValidTime(item.closeTime)) {
          return res.status(400).json({ error: `Invalid time for ${item.dayOfWeek}` });
        }

        if (item.openTime >= item.closeTime) {
          return res
            .status(400)
            .json({ error: `${item.dayOfWeek}: openTime must be before closeTime` });
        }
      }
    }

    await prisma.$transaction(
      hours.map((item) =>
        prisma.salonBusinessHour.upsert({
          where: {
            salonId_dayOfWeek: {
              salonId: user.adminSalon!.id,
              dayOfWeek: item.dayOfWeek,
            },
          },
          update: {
            openTime: item.openTime,
            closeTime: item.closeTime,
            isClosed: item.isClosed,
          },
          create: {
            salonId: user.adminSalon!.id,
            dayOfWeek: item.dayOfWeek,
            openTime: item.openTime,
            closeTime: item.closeTime,
            isClosed: item.isClosed,
          },
        })
      )
    );

    const updated = await prisma.salonBusinessHour.findMany({
      where: { salonId: user.adminSalon.id },
      orderBy: { dayOfWeek: "asc" },
    });

    return res.json({
      message: "Salon hours updated successfully",
      hours: updated,
    });
  } catch (error) {
    console.error("UPDATE salon hours error:", error);
    return res.status(500).json({ error: "Failed to update salon hours" });
  }
});

export default router;