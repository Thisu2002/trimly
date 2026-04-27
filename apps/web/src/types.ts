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