import { type NextRequest } from "next/server";

import { jsonError, jsonSuccess } from "@/lib/server/api-response";
import { OWNER_COOKIE_NAME, getOrCreateOwnerContext } from "@/lib/server/cookies";
import { getRepositories } from "@/lib/server/dependencies";
import { listSavedPlans } from "@/lib/server/plan-service";

export async function GET(request: NextRequest) {
  const ownerContext = getOrCreateOwnerContext(request.cookies.get(OWNER_COOKIE_NAME)?.value);

  try {
    const plans = await listSavedPlans(ownerContext.ownerId, getRepositories());
    return jsonSuccess(plans, ownerContext);
  } catch (error) {
    return jsonError(error, ownerContext);
  }
}
