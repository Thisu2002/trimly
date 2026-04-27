import { prisma } from "../lib/prisma";
import { verifyIdToken } from "../lib/auth";

export async function resolveProgram(idToken: string): Promise<string> {
  const payload = await verifyIdToken(idToken);
  const sub = String(payload.sub);

  const user = await prisma.user.findUnique({
    where: { auth0Sub: sub },
    include: { adminSalon: true },
  });

  if (!user || user.role !== "admin") throw { status: 403, message: "Not allowed" };
  if (!user.adminSalon) throw { status: 400, message: "Create salon first" };

  const salonId = user.adminSalon.id;

  // upsert: creates on first call, returns existing on all subsequent ones
  // Safe under concurrent requests — no P2002
  const program = await prisma.loyaltyProgram.upsert({
    where: { salonId },
    update: {},
    create: { salonId },
  });

  // Seed defaults only if empty — skipDuplicates handles any remaining races
  const [ruleCount, tierCount] = await Promise.all([
    prisma.loyaltyRule.count({ where: { programId: program.id } }),
    prisma.loyaltyTier.count({ where: { programId: program.id } }),
  ]);

  if (ruleCount === 0) {
    await prisma.loyaltyRule.createMany({
      skipDuplicates: true,
      data: [
        { programId: program.id, action: "service_completed", label: "Service Completed",      description: "Base points per completed service",   points: 10, iconKey: "check",    colorKey: "green"  },
        { programId: program.id, action: "review_submitted",  label: "Review Submitted",       description: "Bonus for writing a review",          points: 5,  iconKey: "message",  colorKey: "blue"   },
        { programId: program.id, action: "monthly_visit",     label: "Monthly Visit Bonus",    description: "Returning customer bonus each month", points: 10, iconKey: "calendar", colorKey: "purple" },
        { programId: program.id, action: "spending_per_100",  label: "Spending (per LKR 100)", description: "Points based on total spend",         points: 1,  iconKey: "dollar",   colorKey: "gray"   },
      ],
    });
  }

  if (tierCount === 0) {
    await prisma.loyaltyTier.createMany({
      skipDuplicates: true,
      data: [
        { programId: program.id, name: "Bronze",   threshold: 0,    multiplier: 1.0, sortOrder: 0, benefits: ["Earn 10 points per service", "Basic rewards access"] },
        { programId: program.id, name: "Silver",   threshold: 200,  multiplier: 1.5, sortOrder: 1, benefits: ["Earn 15 points per service", "Priority support", "Exclusive rewards"] },
        { programId: program.id, name: "Gold",     threshold: 600,  multiplier: 2.0, sortOrder: 2, benefits: ["Earn 20 points per service", "Priority booking", "Birthday bonus"] },
        { programId: program.id, name: "Platinum", threshold: 1200, multiplier: 2.5, sortOrder: 3, benefits: ["Earn 25 points per service", "VIP treatment", "Free upgrades"] },
      ],
    });
  }

  return program.id;
}