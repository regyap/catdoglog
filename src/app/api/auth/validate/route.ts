import { signUpSchema } from "@/lib/validation/auth";

const MAX_BODY_BYTES = 8_192;

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) {
    return Response.json({ error: "Request is too large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = signUpSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", fields: parsed.error.flatten().fieldErrors },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    { valid: true, next: "identity-provider" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
