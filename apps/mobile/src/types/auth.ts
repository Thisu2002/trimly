//D:\trimly\apps\mobile\src\types\auth.ts
export type AuthUser = {
  name?: string;
  email?: string;
  picture?: string;
  sub?: string;
  role?: "customer" | "admin" | "stylist";
};
