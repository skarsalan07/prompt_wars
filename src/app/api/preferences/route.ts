import { type NextRequest } from "next/server";

import { jsonError, jsonSuccess } from "@/lib/server/api-response";
import { OWNER_COOKIE_NAME, getOrCreateOwnerContext } from "@/lib/server/cookies";
import { getRepositories } from "@/lib/server/dependencies";
import { getSavedPreferences } from "@/lib/server/plan-service";

export async function GET(request: NextRequest) {
  const ownerContext = getOrCreateOwnerContext(request.cookies.get(OWNER_COOKIE_NAME)?.value);

  try {
    const preferences = await getSavedPreferences(ownerContext.ownerId, getRepositories());
    return jsonSuccess(preferences, ownerContext);
  } catch (error) {
    return jsonError(error, ownerContext);
  }
}
