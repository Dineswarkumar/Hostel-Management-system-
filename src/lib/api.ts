import { NextRequest, NextResponse } from "next/server";
import { z, ZodSchema } from "zod";

/**
 * Validate the JSON body of a request against a Zod schema.
 * Returns either the parsed data (proceed) or a 400 NextResponse.
 */
export async function validateBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return {
      error: NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      ),
    };
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    const first = result.error.issues[0];
    return {
      error: NextResponse.json(
        {
          error: first?.message ?? "Invalid request body",
          field: first?.path?.join(".") ?? null,
          issues: result.error.issues,
        },
        { status: 400 }
      ),
    };
  }
  return { data: result.data };
}
