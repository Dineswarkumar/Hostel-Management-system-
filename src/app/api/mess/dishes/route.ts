import { NextResponse } from "next/server";
import { messService } from "@/features/mess";

/**
 * GET /api/mess/dishes?q=paneer
 * Lists / searches the dish catalog.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? undefined;
  const dishes = await messService.listDishes(q);
  return NextResponse.json({
    count: dishes.length,
    query: q ?? null,
    dishes,
  });
}
