// D:\trimly\apps\mobile\src\types\loyalty.ts
export interface CustomerPointsSummary {
  total: number;
  lifetime: number;
  toNextTier: number;
  tierProgress: number; // 0-100
}

export interface CustomerTierInfo {
  id: string;
  name: string;
  threshold: number;
  multiplier: number;
  benefits: string[];
  sortOrder: number;
}

export interface TierWithStatus extends CustomerTierInfo {
  unlocked: boolean;
  isCurrent: boolean;
}

export interface NextTierInfo {
  name: string;
  threshold: number;
  sortOrder: number;
}

export interface CustomerReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  tierRequired: string;
  totalRedeemed: number;
  canRedeem: boolean;
  tierLocked: boolean;
}

export type HistoryEntryType = "earned" | "spent";

export interface HistoryEntry {
  type: HistoryEntryType;
  label: string;
  description: string;
  points: number; // positive = earned, negative = spent
  date: string;   // ISO string
}

export interface LoyaltyRule {
  id: string;
  action: string;
  label: string;
  description: string;
  points: number;
  iconKey: string;
  colorKey: string;
}

export interface LoyaltySummaryResponse {
  points: CustomerPointsSummary | null;
  currentTier: CustomerTierInfo | null;
  nextTier: NextTierInfo | null;
  tiers: TierWithStatus[];
  availableRewards: CustomerReward[];
  history: HistoryEntry[];
  rules: LoyaltyRule[];
}