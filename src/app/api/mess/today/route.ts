import { NextResponse } from "next/server";
import { messService, MEAL_LABEL, MEAL_TIME } from "@/features/mess";

/**
 * GET /api/mess/today
 * Returns today's mess menu with dish details resolved.
 */
export async function GET() {
  const menu = await messService.getMenu();
  if (!menu) {
    return NextResponse.json(
      { error: "No menu available for today" },
      { status: 404 }
    );
  }

  // Resolve dish IDs → full dish objects
  const { DISH_CATALOG, findDish } = await import("@/features/mess");
  const resolved = Object.entries(menu.meals).map(([meal, items]) => ({
    meal,
    mealLabel: MEAL_LABEL[meal as keyof typeof MEAL_LABEL],
    mealTime: MEAL_TIME[meal as keyof typeof MEAL_TIME],
    items: items.map((i) => {
      const dish = findDish(i.dishId);
      return {
        ...i,
        dish,
        // Defensive — if dish missing from catalog, return a stub so the
        // frontend never crashes. This is the "no bugs when we add/remove
        // dishes" promise.
        dishMissing: !dish,
      };
    }),
  }));

  return NextResponse.json({
    date: menu.date,
    meals: resolved,
    totalDishesInCatalog: DISH_CATALOG.length,
    generatedAt: new Date().toISOString(),
  });
}
