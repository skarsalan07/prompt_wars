import Groq, { APIConnectionTimeoutError, APIError } from "groq-sdk";
import { ZodError } from "zod";

import { aiPlanSchema, type AIPlanPayload } from "@/lib/cooking-assistant/schemas";
import type { NormalizedCookingPlanRequest } from "@/lib/cooking-assistant/types";
import { getGroqEnv } from "@/lib/server/env";
import { AppError } from "@/lib/server/errors";
import { buildCookingPlanPrompt, COOKING_PLAN_RESPONSE_SCHEMA, MODEL_MAX_OUTPUT_TOKENS, MODEL_TEMPERATURE } from "@/lib/server/prompt-builder";

export interface LLMPlanner {
  generate(input: NormalizedCookingPlanRequest): Promise<AIPlanPayload>;
}

export function createGroqPlanner(): LLMPlanner {
  const env = getGroqEnv();
  const client = new Groq({
    apiKey: env.GROQ_API_KEY,
    timeout: 15_000,
    maxRetries: 2,
  });

  return {
    async generate(input) {
      const prompt = buildCookingPlanPrompt(input);

      try {
        return await generateWithStructuredOutputs(client, env.GROQ_MODEL, prompt.systemPrompt, prompt.userPrompt);
      } catch (error) {
        if (!isStructuredOutputSupportError(error)) {
          throw normalizeGroqError(error);
        }
      }

      try {
        return await generateWithJsonMode(client, env.GROQ_MODEL, prompt.systemPrompt, prompt.userPrompt);
      } catch (error) {
        throw normalizeGroqError(error);
      }
    },
  };
}

async function generateWithStructuredOutputs(
  client: Groq,
  model: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<AIPlanPayload> {
  const completion = await client.chat.completions.create({
    model,
    temperature: MODEL_TEMPERATURE,
    seed: 7,
    max_completion_tokens: MODEL_MAX_OUTPUT_TOKENS,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "daily_cooking_plan",
        description: "Breakfast, lunch, and dinner cooking plan with ingredients, steps, substitutions, and nutrition.",
        schema: COOKING_PLAN_RESPONSE_SCHEMA,
        strict: true,
      },
    },
  });

  return parseCompletionContent(completion.choices[0]?.message?.content);
}

async function generateWithJsonMode(
  client: Groq,
  model: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<AIPlanPayload> {
  const completion = await client.chat.completions.create({
    model,
    temperature: MODEL_TEMPERATURE,
    seed: 7,
    max_completion_tokens: MODEL_MAX_OUTPUT_TOKENS,
    messages: [
      { role: "system", content: `${systemPrompt}\nReturn a JSON object matching the requested schema exactly.` },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_object",
    },
  });

  return parseCompletionContent(completion.choices[0]?.message?.content);
}

function parseCompletionContent(content: string | null | undefined): AIPlanPayload {
  if (!content) {
    throw new AppError({
      code: "MODEL_EMPTY_RESPONSE",
      message: "Groq returned an empty meal plan response.",
      status: 502,
    });
  }

  const parsed = JSON.parse(content);
  return aiPlanSchema.parse(parsed);
}

function isStructuredOutputSupportError(error: unknown): boolean {
  return error instanceof APIError && error.status === 400 && /json_schema|structured output|response_format/i.test(error.message);
}

function normalizeGroqError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof SyntaxError) {
    return new AppError({
      code: "MODEL_MALFORMED_RESPONSE",
      message: "Groq returned malformed JSON.",
      status: 502,
    });
  }

  if (error instanceof ZodError) {
    return new AppError({
      code: "MODEL_SCHEMA_MISMATCH",
      message: "Groq returned JSON that did not match the expected cooking-plan schema.",
      status: 502,
    });
  }

  if (error instanceof APIConnectionTimeoutError) {
    return new AppError({
      code: "MODEL_TIMEOUT",
      message: "Groq took too long to generate the meal plan.",
      status: 504,
    });
  }

  if (error instanceof APIError) {
    if (error.status === 401 || error.status === 403) {
      return new AppError({
        code: "MODEL_AUTH_ERROR",
        message: "Groq authentication failed. Check the server-side API key configuration.",
        status: 502,
      });
    }

    if (error.status === 429) {
      return new AppError({
        code: "MODEL_RATE_LIMITED",
        message: "Groq is rate-limiting requests right now. Please try again shortly.",
        status: 503,
      });
    }

    return new AppError({
      code: "MODEL_UPSTREAM_ERROR",
      message: `Groq request failed with status ${error.status}.`,
      status: 502,
    });
  }

  if (error instanceof Error) {
    return new AppError({
      code: "MODEL_ERROR",
      message: error.message,
      status: 502,
    });
  }

  return new AppError({
    code: "MODEL_ERROR",
    message: "Unexpected Groq error.",
    status: 502,
  });
}
