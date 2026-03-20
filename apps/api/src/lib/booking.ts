import { DayOfWeek } from "@prisma/client";

export function parseTimeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function addMinutes(time: string, mins: number) {
  return minutesToTime(parseTimeToMinutes(time) + mins);
}

export function overlaps(
  startA: string,
  endA: string,
  startB: string,
  endB: string
) {
  const a1 = parseTimeToMinutes(startA);
  const a2 = parseTimeToMinutes(endA);
  const b1 = parseTimeToMinutes(startB);
  const b2 = parseTimeToMinutes(endB);

  return a1 < b2 && b1 < a2;
}

export function toDateOnly(dateStr: string) {
  return new Date(`${dateStr}T12:00:00.000Z`);
}

export function getDayOfWeek(dateStr: string): DayOfWeek {
  const d = new Date(`${dateStr}T12:00:00.000Z`);
  const day = d.getUTCDay();

  const days: DayOfWeek[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  return days[day];
}

export function generateSlots(
  openTime: string,
  closeTime: string,
  slotDuration: number,
  appointmentDuration: number
) {
  const slots: string[] = [];
  let current = parseTimeToMinutes(openTime);
  const close = parseTimeToMinutes(closeTime);

  while (current + appointmentDuration <= close) {
    slots.push(minutesToTime(current));
    current += slotDuration;
  }

  return slots;
}