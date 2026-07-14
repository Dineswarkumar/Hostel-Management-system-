import { NextResponse } from "next/server";
import { messService, MEAL_LABEL, MEAL_TIME } from "@/features/mess";
import { findDish } from "@/features/mess";

/**
 * GET /api/mess/menu/[date]
 * Returns menu for a specific date (YYYY-MM-DD).
 */
export async function GET(
  _req: Request,
  { params }: { params: { date: string } }
) {
  const menu = await messService.getMenu(params.date);
  if (!menu) {
    return NextResponse.json(
      { error: `No menu for ${params.date}` },
      { status: 404 }
    );
  }

  const resolved = Object.entries(menu.meals).map(([meal, items]) => ({
    meal,
    mealLabel: MEAL_LABEL[meal as keyof typeof MEAL_LABEL],
    mealTime: MEAL_TIME[meal as keyof typeof MEAL_TIME],
    items: items.map((i) => ({
      ...i,
      dish: findDish(i.dishId),
    })),
  }));

  return NextResponse.json({ date: menu.date, meals: resolved });
}
