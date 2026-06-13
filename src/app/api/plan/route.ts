import { type NextRequest } from "next/server";

import { jsonError, jsonSuccess } from "@/lib/server/api-response";
import { OWNER_COOKIE_NAME, getOrCreateOwnerContext } from "@/lib/server/cookies";
import { getLLMPlanner, getRepositories } from "@/lib/server/dependencies";
import { generateAndStoreCookingPlan } from "@/lib/server/plan-service";

export async function POST(request: NextRequest) {
  const ownerContext = getOrCreateOwnerContext(request.cookies.get(OWNER_COOKIE_NAME)?.value);

  try {
    const payload = await request.json();
    const plan = await generateAndStoreCookingPlan(payload, ownerContext.ownerId, getRepositories(), getLLMPlanner());
    return jsonSuccess(plan, ownerContext, 201);
  } catch (error) {
    return jsonError(error, ownerContext);
  }
}
