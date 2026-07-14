/**
 * Mess — types, catalog & service.
 * Dish catalog is the source of truth for mess items.
 */

import { sleep } from "@/lib/utils";
import { config } from "@/lib/config";

export type MealType = "BREAKFAST" | "LUNCH" | "SNACKS" | "DINNER";

export type DishCategory =
  | "MAIN"
  | "SIDE"
  | "BREAD"
  | "RICE"
  | "DAL"
  | "CURRY"
  | "DESSERT"
  | "BEVERAGE"
  | "SALAD"
  | "SNACK";

export interface Dish {
  id: string;
  name: string;
  category: DishCategory;
  description?: string;
  vegetarian: boolean;
  spicy: 0 | 1 | 2 | 3;
  emoji: string;
}

export const DISH_CATALOG: Dish[] = [
  // Mains / curries
  { id: "d_paneer_butter_masala", name: "Paneer Butter Masala", category: "CURRY", vegetarian: true, spicy: 1, emoji: "🧀" },
  { id: "d_chicken_curry", name: "Chicken Curry", category: "CURRY", vegetarian: false, spicy: 2, emoji: "🍗" },
  { id: "d_egg_curry", name: "Egg Curry", category: "CURRY", vegetarian: false, spicy: 1, emoji: "🥚" },
  { id: "d_mix_veg", name: "Mix Veg", category: "CURRY", vegetarian: true, spicy: 1, emoji: "🥦" },
  { id: "d_chole", name: "Chole (Chickpea Curry)", category: "CURRY", vegetarian: true, spicy: 2, emoji: "🌶️" },
  { id: "d_dal_makhani", name: "Dal Makhani", category: "DAL", vegetarian: true, spicy: 0, emoji: "🫘" },
  { id: "d_dal_tadka", name: "Dal Tadka", category: "DAL", vegetarian: true, spicy: 1, emoji: "🍲" },
  { id: "d_rajma", name: "Rajma", category: "CURRY", vegetarian: true, spicy: 1, emoji: "🫘" },
  { id: "d_fish_curry", name: "Fish Curry", category: "CURRY", vegetarian: false, spicy: 2, emoji: "🐟" },
  // Rice / bread
  { id: "d_steamed_rice", name: "Steamed Rice", category: "RICE", vegetarian: true, spicy: 0, emoji: "🍚" },
  { id: "d_jeera_rice", name: "Jeera Rice", category: "RICE", vegetarian: true, spicy: 0, emoji: "🍚" },
  { id: "d_biryani", name: "Veg Biryani", category: "RICE", vegetarian: true, spicy: 2, emoji: "🍛" },
  { id: "d_chicken_biryani", name: "Chicken Biryani", category: "RICE", vegetarian: false, spicy: 2, emoji: "🍛" },
  { id: "d_roti", name: "Roti", category: "BREAD", vegetarian: true, spicy: 0, emoji: "🫓" },
  { id: "d_naan", name: "Naan", category: "BREAD", vegetarian: true, spicy: 0, emoji: "🥖" },
  { id: "d_paratha", name: "Aloo Paratha", category: "BREAD", vegetarian: true, spicy: 0, emoji: "🥙" },
  // Sides
  { id: "d_raita", name: "Raita", category: "SIDE", vegetarian: true, spicy: 0, emoji: "🥣" },
  { id: "d_papad", name: "Papad", category: "SIDE", vegetarian: true, spicy: 0, emoji: "🥨" },
  { id: "d_pickle", name: "Pickle", category: "SIDE", vegetarian: true, spicy: 3, emoji: "🌶️" },
  { id: "d_salad", name: "Green Salad", category: "SALAD", vegetarian: true, spicy: 0, emoji: "🥗" },
  // Breakfast
  { id: "d_idli", name: "Idli", category: "MAIN", vegetarian: true, spicy: 0, emoji: "🍙" },
  { id: "d_dosa", name: "Dosa", category: "MAIN", vegetarian: true, spicy: 0, emoji: "🥞" },
  { id: "d_upma", name: "Upma", category: "MAIN", vegetarian: true, spicy: 0, emoji: "🥣" },
  { id: "d_poha", name: "Poha", category: "MAIN", vegetarian: true, spicy: 1, emoji: "🍚" },
  { id: "d_bread_butter", name: "Bread Butter + Jam", category: "MAIN", vegetarian: true, spicy: 0, emoji: "🍞" },
  { id: "d_omelette", name: "Omelette", category: "MAIN", vegetarian: false, spicy: 0, emoji: "🍳" },
  { id: "d_boiled_eggs", name: "Boiled Eggs", category: "MAIN", vegetarian: false, spicy: 0, emoji: "🥚" },
  // Snacks
  { id: "d_samosa", name: "Samosa", category: "SNACK", vegetarian: true, spicy: 1, emoji: "🥟" },
  { id: "d_vada_pav", name: "Vada Pav", category: "SNACK", vegetarian: true, spicy: 1, emoji: "🍔" },
  { id: "d_pakora", name: "Pakora", category: "SNACK", vegetarian: true, spicy: 1, emoji: "🍤" },
  { id: "d_sandwich", name: "Veg Sandwich", category: "SNACK", vegetarian: true, spicy: 0, emoji: "🥪" },
  // Beverages / desserts
  { id: "d_tea", name: "Tea", category: "BEVERAGE", vegetarian: true, spicy: 0, emoji: "🍵" },
  { id: "d_coffee", name: "Coffee", category: "BEVERAGE", vegetarian: true, spicy: 0, emoji: "☕" },
  { id: "d_milk", name: "Milk", category: "BEVERAGE", vegetarian: true, spicy: 0, emoji: "🥛" },
  { id: "d_buttermilk", name: "Buttermilk", category: "BEVERAGE", vegetarian: true, spicy: 0, emoji: "🥛" },
  { id: "d_lassi", name: "Lassi", category: "BEVERAGE", vegetarian: true, spicy: 0, emoji: "🥤" },
  { id: "d_gulab_jamun", name: "Gulab Jamun", category: "DESSERT", vegetarian: true, spicy: 0, emoji: "🍩" },
  { id: "d_ice_cream", name: "Ice Cream", category: "DESSERT", vegetarian: true, spicy: 0, emoji: "🍨" },
  { id: "d_fruit", name: "Seasonal Fruit", category: "DESSERT", vegetarian: true, spicy: 0, emoji: "🍎" },
  { id: "d_kheer", name: "Kheer", category: "DESSERT", vegetarian: true, spicy: 0, emoji: "🍮" },
];

export function findDish(id: string): Dish | undefined {
  return DISH_CATALOG.find((d) => d.id === id);
}

export function searchDishes(query: string): Dish[] {
  const q = query.trim().toLowerCase();
  if (!q) return DISH_CATALOG;
  return DISH_CATALOG.filter(
    (d) =>
      d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q)
  );
}

export interface MessMenu {
  date: string; // ISO date (YYYY-MM-DD)
  meals: Record<MealType, Array<{ dishId: string; servings: number }>>;
}

const TODAY = new Date().toISOString().slice(0, 10);

const MENU: Record<string, MessMenu> = {
  [TODAY]: {
    date: TODAY,
    meals: {
      BREAKFAST: [
        { dishId: "d_idli", servings: 1 },
        { dishId: "d_dosa", servings: 1 },
        { dishId: "d_bread_butter", servings: 1 },
        { dishId: "d_tea", servings: 1 },
        { dishId: "d_coffee", servings: 1 },
        { dishId: "d_boiled_eggs", servings: 1 },
      ],
      LUNCH: [
        { dishId: "d_steamed_rice", servings: 1 },
        { dishId: "d_roti", servings: 1 },
        { dishId: "d_dal_tadka", servings: 1 },
        { dishId: "d_chicken_curry", servings: 1 },
        { dishId: "d_mix_veg", servings: 1 },
        { dishId: "d_raita", servings: 1 },
        { dishId: "d_salad", servings: 1 },
      ],
      SNACKS: [
        { dishId: "d_samosa", servings: 1 },
        { dishId: "d_tea", servings: 1 },
        { dishId: "d_coffee", servings: 1 },
      ],
      DINNER: [
        { dishId: "d_jeera_rice", servings: 1 },
        { dishId: "d_naan", servings: 1 },
        { dishId: "d_paneer_butter_masala", servings: 1 },
        { dishId: "d_egg_curry", servings: 1 },
        { dishId: "d_dal_makhani", servings: 1 },
        { dishId: "d_papad", servings: 1 },
        { dishId: "d_ice_cream", servings: 1 },
      ],
    },
  },
};

const latency = () =>
  sleep(
    config.mockLatency.min +
      Math.random() * (config.mockLatency.max - config.mockLatency.min)
  );

export const messService = {
  async getMenu(date?: string): Promise<MessMenu | null> {
    if (config.useMockData || typeof window === "undefined") {
      const key = date ?? TODAY;
      return MENU[key] ?? null;
    }

    const key = date ?? TODAY;
    const res = await fetch(`/api/mess/menu/${key}`);
    if (!res.ok) return null;
    return res.json();
  },

  async listDishes(query?: string): Promise<Dish[]> {
    if (config.useMockData || typeof window === "undefined") {
      return query ? searchDishes(query) : DISH_CATALOG;
    }

    const q = query ? `?query=${encodeURIComponent(query)}` : "";
    const res = await fetch(`/api/mess/dishes${q}`);
    if (!res.ok) throw new Error("Failed to fetch dishes");
    return res.json();
  },
};

export const MEAL_LABEL: Record<MealType, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  SNACKS: "Snacks",
  DINNER: "Dinner",
};

export const MEAL_TIME: Record<MealType, string> = {
  BREAKFAST: "7:30 – 9:30 AM",
  LUNCH: "12:30 – 2:30 PM",
  SNACKS: "4:30 – 6:00 PM",
  DINNER: "7:30 – 9:30 PM",
};
