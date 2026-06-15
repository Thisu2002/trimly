type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface RecentAppointment {
  id: string;
  customerName: string;
  date: string;
  startTime: string;
  endTime: string;
  totalLkr: number;
  status: AppointmentStatus;
  services: { name: string; stylist: string }[];
};

export interface InventoryItem {
  id: string;
  name: string;
  currentStock: number;
  minStock: number;
  unit: string;
};

export interface Stylist {
  id: string;
  status: "on_duty" | "on_leave";
  user: { name: string };
  services: { priceLkr: number }[];
};

export interface LoyaltyStats {
  totalMembers: number;
  activeMembers: number;
  pointsIssued: number;
  rewardsRedeemed: number;
};

export interface DashboardData {
  appointments: RecentAppointment[];
  inventoryItems: InventoryItem[];
  stylists: Stylist[];
  loyaltyStats: LoyaltyStats;
};

export interface LoyaltyTier {
  id: string;
  name: string;
  threshold: number;
  multiplier: number;
  benefits: string[];
  sortOrder: number; // used for color assignment by index
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  tierRequired: string; // tier name
  active: boolean;
  totalRedeemed: number;
}

export interface PointsRule {
  id: string;
  action: string;          // e.g. "service_completed"
  label: string;           // display label
  description: string;
  points: number;
  iconKey: string;         // "check" | "message" | "calendar" | "dollar"
  colorKey: string;        // tailwind gradient string
}

export interface LoyaltyStats {
  totalMembers: number;
  activeMembers: number;
  pointsIssued: number;
  rewardsRedeemed: number;
}