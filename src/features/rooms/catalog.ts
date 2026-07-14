/**
 * Room types — the 5 available categories.
 * Defined as a catalog so we can add/modify types with no schema change.
 */

export type RoomTypeId =
  | "FOUR_SEATER"
  | "THREE_SEATER"
  | "TWO_SEATER"
  | "SINGLE_SEATER"
  | "PVT_DELUXE";

export interface RoomType {
  id: RoomTypeId;
  name: string;
  shortName: string;
  capacity: number;
  basePricePerMonth: number; // INR
  description: string;
  amenities: string[];
  badge?: "popular" | "premium" | "value";
  emoji: string;
}

export const ROOM_TYPES: RoomType[] = [
  {
    id: "FOUR_SEATER",
    name: "4-Seater Shared Room",
    shortName: "4-Seater",
    capacity: 4,
    basePricePerMonth: 3500,
    description:
      "Spacious shared room with four individual beds, study desks, and wardrobes. Best value for budget-conscious students.",
    amenities: ["4 individual beds", "4 study desks", "Shared bathroom", "Free WiFi", "Common balcony"],
    badge: "value",
    emoji: "🛏️🛏️🛏️🛏️",
  },
  {
    id: "THREE_SEATER",
    name: "3-Seater Shared Room",
    shortName: "3-Seater",
    capacity: 3,
    basePricePerMonth: 4500,
    description:
      "Balanced shared room with three beds, more personal space than a 4-seater, and a cozy common area.",
    amenities: ["3 individual beds", "3 study desks", "Shared bathroom", "Free WiFi", "Wardrobes"],
    badge: "popular",
    emoji: "🛏️🛏️🛏️",
  },
  {
    id: "TWO_SEATER",
    name: "2-Seater Shared Room",
    shortName: "2-Seater",
    capacity: 2,
    basePricePerMonth: 6000,
    description:
      "Comfortable twin-sharing room with two beds, a shared study area, and a private balcony in select rooms.",
    amenities: ["2 beds", "2 study desks", "Attached bathroom", "Free WiFi", "Balcony (select rooms)"],
    badge: "popular",
    emoji: "🛏️🛏️",
  },
  {
    id: "SINGLE_SEATER",
    name: "Single Seater Room",
    shortName: "Single",
    capacity: 1,
    basePricePerMonth: 8000,
    description:
      "Private single-occupancy room for focused living. Includes an attached bathroom and a study nook.",
    amenities: ["Single bed", "Study desk", "Attached bathroom", "Free WiFi", "Personal wardrobe"],
    emoji: "🛏️",
  },
  {
    id: "PVT_DELUXE",
    name: "Private Deluxe Room",
    shortName: "Deluxe",
    capacity: 1,
    basePricePerMonth: 12000,
    description:
      "Top-tier private suite with premium furnishing, attached bathroom, AC, and a lounge area.",
    amenities: ["Queen bed", "AC", "Premium attached bathroom", "Lounge area", "Smart TV", "Mini fridge"],
    badge: "premium",
    emoji: "🌟",
  },
];

export function getRoomType(id: RoomTypeId): RoomType {
  const found = ROOM_TYPES.find((r) => r.id === id);
  if (!found) throw new Error(`Unknown room type: ${id}`);
  return found;
}
