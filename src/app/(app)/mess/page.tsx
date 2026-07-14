"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { UtensilsCrossed, Coffee, Utensils, Cookie, Moon, Star } from "lucide-react";
import { useAuth, RoleGuard } from "@/features/auth";
import {
  messService,
  MEAL_LABEL,
  MEAL_TIME,
  DISH_CATALOG,
  findDish,
  type Dish,
  type MealType,
  type MessMenu,
} from "@/features/mess";
import { GlassSurface } from "@/components/glass/glass-surface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const MEAL_ICON: Record<MealType, React.ComponentType<{ className?: string }>> = {
  BREAKFAST: Coffee,
  LUNCH: Utensils,
  SNACKS: Cookie,
  DINNER: Moon,
};

const MEAL_ORDER: MealType[] = ["BREAKFAST", "LUNCH", "SNACKS", "DINNER"];

export default function MessPage() {
  return (
    <RoleGuard>
      <MessContent />
    </RoleGuard>
  );
}

function MessContent() {
  const [menu, setMenu] = React.useState<MessMenu | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [apiSource, setApiSource] = React.useState<"mock" | "api">("mock");
  const { toast } = useToast();

  // Try real API first; fall back to mock service
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/mess/today", { cache: "no-store" });
        if (!res.ok) throw new Error("api failed");
        const data = await res.json();
        if (cancelled) return;
        // Map API response back to the same shape the UI expects
        setMenu({
          date: data.date,
          meals: Object.fromEntries(
            data.meals.map((m: {
              meal: MealType;
              items: Array<{ dishId: string; servings: number; dish: Dish }>;
            }) => [
              m.meal,
              m.items.map((i) => ({ dishId: i.dishId, servings: i.servings })),
            ])
          ) as MessMenu["meals"],
        });
        setApiSource("api");
      } catch {
        const m = await messService.getMenu();
        if (!cancelled) {
          setMenu(m);
          setApiSource("mock");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Rate today's meals
  const [ratings, setRatings] = React.useState<Record<MealType, { taste: number; quantity: number; hygiene: number } | null>>({
    BREAKFAST: null,
    LUNCH: null,
    SNACKS: null,
    DINNER: null,
  });

  const setRating = (meal: MealType, field: "taste" | "quantity" | "hygiene", value: number) => {
    setRatings((r) => ({
      ...r,
      [meal]: {
        taste: r[meal]?.taste ?? 0,
        quantity: r[meal]?.quantity ?? 0,
        hygiene: r[meal]?.hygiene ?? 0,
        [field]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <UtensilsCrossed className="h-7 w-7 text-primary" /> Mess
          </h1>
          <p className="text-muted text-sm">
            Today's menu · {menu?.date ?? "—"}
            {apiSource === "api" && (
              <Badge tone="success" className="ml-2">via API</Badge>
            )}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : !menu ? (
        <GlassSurface className="p-12 text-center text-sm text-muted">
          No menu available.
        </GlassSurface>
      ) : (
        <div className="space-y-4">
          {MEAL_ORDER.map((meal) => (
            <MealCard
              key={meal}
              meal={meal}
              items={menu.meals[meal] ?? []}
              rating={ratings[meal]}
              onRate={(field, val) => setRating(meal, field, val)}
              onRateSubmit={() => toast({ title: "Thanks for rating!", tone: "success" })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MealCard({
  meal, items, rating, onRate, onRateSubmit,
}: {
  meal: MealType;
  items: Array<{ dishId: string; servings: number }>;
  rating: { taste: number; quantity: number; hygiene: number } | null;
  onRate: (field: "taste" | "quantity" | "hygiene", value: number) => void;
  onRateSubmit: () => void;
}) {
  const Icon = MEAL_ICON[meal];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <GlassSurface intensity="default" className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl skeuo-btn grid place-items-center">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold">{MEAL_LABEL[meal]}</div>
              <div className="text-xs text-muted">{MEAL_TIME[meal]}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {items.length === 0 ? (
            <span className="text-sm text-muted">No items listed.</span>
          ) : (
            items.map((i) => (
              <DishChip key={i.dishId} dishId={i.dishId} />
            ))
          )}
        </div>

        {/* Rating */}
        <div className="border-t border-border/50 pt-3 space-y-2">
          <div className="text-xs text-muted">Rate this meal (optional)</div>
          <div className="grid grid-cols-3 gap-2">
            {(["taste", "quantity", "hygiene"] as const).map((field) => (
              <div key={field} className="flex flex-col items-center">
                <div className="text-[10px] text-muted capitalize mb-1">{field}</div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => onRate(field, v)}
                      className="p-0.5"
                      aria-label={`${field} ${v}`}
                    >
                      <Star
                        className={cn(
                          "h-4 w-4 transition-colors",
                          rating && rating[field] >= v
                            ? "fill-warning text-warning"
                            : "text-muted"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {rating && (rating.taste || rating.quantity || rating.hygiene) > 0 && (
            <Button size="sm" variant="skeuo" className="w-full" onClick={onRateSubmit}>
              Submit rating
            </Button>
          )}
        </div>
      </GlassSurface>
    </motion.div>
  );
}

function DishChip({ dishId }: { dishId: string }) {
  // Local lookup from the dish catalog — instant, no network.
  // If a dish id is removed from the catalog, the UI gracefully shows
  // "Unknown dish" instead of crashing (the "no bugs when we add/remove
  // dishes" promise).
  const dish = findDish(dishId);
  if (!dish) {
    return (
      <span className="text-sm px-3 py-1.5 rounded-full bg-surface-2 text-muted">
        Unknown dish
      </span>
    );
  }
  return (
    <span className="text-sm px-3 py-1.5 rounded-full bg-surface-2 flex items-center gap-1.5">
      <span>{dish.emoji}</span>
      <span>{dish.name}</span>
      {dish.vegetarian && <span className="text-success text-xs" title="Vegetarian">●</span>}
    </span>
  );
}
