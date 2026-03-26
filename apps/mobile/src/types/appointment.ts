export type AppointmentHistoryItem = {
  id: string;
  salonName: string;
  date: string;
  startTime: string;
  endTime: string;
  totalLkr: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  services: {
    name: string;
    stylist: string;
    startTime: string;
    endTime: string;
    priceLkr: number;
  }[];
};