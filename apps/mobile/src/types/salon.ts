export type SalonListItem = {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  rating: number;
  reviewCount: number;
  serviceCount: number;
  stylistCount: number;
};

export type ServiceItem = {
  id: string;
  name: string;
  description?: string | null;
  durationMin: number;
  priceLkr: number;
  sequence?: number;
};

export type CategoryItem = {
  id: string;
  name: string;
  description?: string | null;
  services: ServiceItem[];
};

export type StylistItem = {
  id: string;
  name: string;
  bio?: string | null;
  yearsOfExperience?: number | null;
};

export type SalonDetail = {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  about: string;
  rating: number;
  reviewCount: number;
  photoSlots: number;
  categories: CategoryItem[];
  stylists: StylistItem[];
};

export type SlotItem = {
  startTime: string;
  endTime: string;
  disabled: boolean;
  salonBusy: boolean;
};

export type AvailableStylistGroup = {
  serviceId: string;
  serviceName: string;
  sequence: number;
  serviceStartTime: string;
  serviceEndTime: string;
  stylists: StylistItem[];
};

// export type SalonListItem = {
//   id: string;
//   name: string;
//   address?: string | null;
//   phone?: string | null;
//   rating: number;
//   reviewCount: number;
//   serviceCount: number;
//   stylistCount: number;
// };

// export type ServiceItem = {
//   id: string;
//   name: string;
//   description?: string | null;
//   durationMin: number;
//   priceLkr: number;
// };

// export type CategoryItem = {
//   id: string;
//   name: string;
//   description?: string | null;
//   services: ServiceItem[];
// };

// export type StylistItem = {
//   id: string;
//   name: string;
//   bio?: string | null;
//   yearsOfExperience?: number | null;
// };

// export type SalonDetail = {
//   id: string;
//   name: string;
//   address?: string | null;
//   phone?: string | null;
//   about: string;
//   rating: number;
//   reviewCount: number;
//   photoSlots: number;
//   categories: CategoryItem[];
//   stylists: StylistItem[];
// };

// export type SlotItem = {
//   startTime: string;
//   endTime: string;
//   disabled: boolean;
//   salonBusy: boolean;
// };

// export type AvailableStylistGroup = {
//   serviceId: string;
//   serviceName: string;
//   stylists: StylistItem[];
// };