const DEFAULT_MONGODB_DB_NAME = "cooking_todo_assistant";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

export function getGroqEnv() {
  return {
    GROQ_API_KEY: requireEnv("GROQ_API_KEY"),
    GROQ_MODEL: process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL,
  };
}

export function getDatabaseEnv() {
  return {
    MONGODB_URI: requireEnv("MONGODB_URI"),
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME?.trim() || DEFAULT_MONGODB_DB_NAME,
  };
}

export function hasDatabaseEnv(): boolean {
  return Boolean(process.env.MONGODB_URI?.trim());
}

export function getCookieSecret(): string {
  return requireEnv("COOKIE_SIGNING_SECRET");
}

function requireEnv(key: keyof NodeJS.ProcessEnv): string {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}
