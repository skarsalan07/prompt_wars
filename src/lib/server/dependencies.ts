import { hasDatabaseEnv } from "@/lib/server/env";
import { createGroqPlanner, type LLMPlanner } from "@/lib/server/groq";
import { createInMemoryRepositories, createMongoRepositories, type Repositories } from "@/lib/server/repositories";

declare global {
  // eslint-disable-next-line no-var
  var __cookingAssistantRepositories: Repositories | undefined;
}

export function getRepositories(): Repositories {
  if (hasDatabaseEnv()) {
    return createMongoRepositories();
  }

  globalThis.__cookingAssistantRepositories ??= createInMemoryRepositories();
  return globalThis.__cookingAssistantRepositories;
}

export function getLLMPlanner(): LLMPlanner {
  return createGroqPlanner();
}
