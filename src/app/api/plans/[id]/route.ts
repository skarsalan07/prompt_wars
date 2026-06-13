import { type NextRequest } from "next/server";

import { jsonError, jsonSuccess } from "@/lib/server/api-response";
import { OWNER_COOKIE_NAME, getOrCreateOwnerContext } from "@/lib/server/cookies";
import { getRepositories } from "@/lib/server/dependencies";
import { getSavedPlanById } from "@/lib/server/plan-service";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const ownerContext = getOrCreateOwnerContext(request.cookies.get(OWNER_COOKIE_NAME)?.value);

  try {
    const { id } = await context.params;
    const plan = await getSavedPlanById(ownerContext.ownerId, id, getRepositories());
    return jsonSuccess(plan, ownerContext);
  } catch (error) {
    return jsonError(error, ownerContext);
  }
}
