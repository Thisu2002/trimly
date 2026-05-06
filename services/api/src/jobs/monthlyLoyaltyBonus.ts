// D:\trimly\services\api\src\jobs\monthlyLoyaltyBonus.ts
//
// Register in app.ts / index.ts:
//   import cron from "node-cron";
//   import { runMonthlyLoyaltyBonus } from "./jobs/monthlyLoyaltyBonus";
//   cron.schedule("0 2 1 * *", runMonthlyLoyaltyBonus); // 2am on 1st of each month
//
// Install: npm install node-cron && npm install -D @types/node-cron

import { prisma } from "../lib/prisma";
import { awardPoints } from "../lib/awardPoints";

export async function runMonthlyLoyaltyBonus() {
  console.log("[monthly-loyalty] Starting monthly visit bonus...");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Find distinct customer+salon pairs that had a completed appointment last 30 days
  const activeVisits = await prisma.appointment.findMany({
    where: { status: "completed", date: { gte: thirtyDaysAgo } },
    select: { customerId: true, salonId: true },
    distinct: ["customerId", "salonId"],
  });

  console.log(`[monthly-loyalty] ${activeVisits.length} eligible customer-salon pairs`);

  let awarded = 0;
  let skipped = 0;

  for (const visit of activeVisits) {
    try {
      const result = await awardPoints({
        customerId: visit.customerId,
        salonId: visit.salonId,
        action: "monthly_visit",
      });
      if (result) {
        awarded++;
        if (result.tierChanged) {
          console.log(`[monthly-loyalty] ${visit.customerId} → ${result.newTierName} at salon ${visit.salonId}`);
        }
      } else {
        skipped++;
      }
    } catch (err) {
      console.error(`[monthly-loyalty] Failed for ${visit.customerId} / ${visit.salonId}:`, err);
    }
  }

  console.log(`[monthly-loyalty] Done. Awarded: ${awarded}, Skipped (no program): ${skipped}`);
}