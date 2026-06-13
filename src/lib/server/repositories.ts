import { ObjectId } from "mongodb";

import type { CookingPlanRequest, PlanResult, SavedPlanSummary, StoredPlan, StoredProfile } from "@/lib/cooking-assistant/types";
import { getMongoDatabase } from "@/lib/server/mongodb";

interface ProfileDocument {
  _id?: ObjectId;
  ownerId: string;
  latestPreferences: CookingPlanRequest;
  createdAt: string;
  updatedAt: string;
}

interface PlanDocument {
  _id?: ObjectId;
  ownerId: string;
  result: PlanResult;
  summary: SavedPlanSummary;
  createdAt: string;
}

export interface ProfileRepository {
  getByOwnerId(ownerId: string): Promise<StoredProfile | null>;
  upsertLatest(ownerId: string, latestPreferences: CookingPlanRequest): Promise<StoredProfile>;
}

export interface PlanRepository {
  listByOwnerId(ownerId: string, limit?: number): Promise<SavedPlanSummary[]>;
  getByIdForOwner(id: string, ownerId: string): Promise<StoredPlan | null>;
  create(ownerId: string, result: PlanResult, summary: SavedPlanSummary): Promise<StoredPlan>;
}

export interface Repositories {
  profiles: ProfileRepository;
  plans: PlanRepository;
}

export function createMongoRepositories(): Repositories {
  return {
    profiles: {
      async getByOwnerId(ownerId) {
        const database = await getMongoDatabase();
        const document = await database.collection<ProfileDocument>("profiles").findOne({ ownerId });
        if (!document) {
          return null;
        }

        return {
          ownerId: document.ownerId,
          latestPreferences: document.latestPreferences,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
        };
      },
      async upsertLatest(ownerId, latestPreferences) {
        const database = await getMongoDatabase();
        const now = new Date().toISOString();
        const collection = database.collection<ProfileDocument>("profiles");

        const existing = await collection.findOne({ ownerId });
        const document: ProfileDocument = {
          ownerId,
          latestPreferences,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        };

        await collection.updateOne(
          { ownerId },
          {
            $set: {
              latestPreferences,
              updatedAt: now,
            },
            $setOnInsert: {
              ownerId,
              createdAt: existing?.createdAt ?? now,
            },
          },
          { upsert: true },
        );

        return document;
      },
    },
    plans: {
      async listByOwnerId(ownerId, limit = 10) {
        const database = await getMongoDatabase();
        const documents = await database
          .collection<PlanDocument>("plans")
          .find({ ownerId }, { projection: { summary: 1 } })
          .sort({ createdAt: -1 })
          .limit(limit)
          .toArray();

        return documents.map((document) => document.summary);
      },
      async getByIdForOwner(id, ownerId) {
        const database = await getMongoDatabase();
        const document = await database.collection<PlanDocument>("plans").findOne({
          _id: new ObjectId(id),
          ownerId,
        });

        if (!document) {
          return null;
        }

        return {
          id: document._id?.toString() ?? id,
          ownerId: document.ownerId,
          result: {
            ...document.result,
            id: document._id?.toString() ?? document.result.id,
          },
          summary: document.summary,
        };
      },
      async create(ownerId, result, summary) {
        const database = await getMongoDatabase();
        const createdAt = result.createdAt;
        const insertion = await database.collection<PlanDocument>("plans").insertOne({
          ownerId,
          result,
          summary,
          createdAt,
        });

        const id = insertion.insertedId.toString();
        return {
          id,
          ownerId,
          result: {
            ...result,
            id,
          },
          summary: {
            ...summary,
            id,
          },
        };
      },
    },
  };
}

export function createInMemoryRepositories(): Repositories {
  const profiles = new Map<string, StoredProfile>();
  const plans = new Map<string, StoredPlan>();

  return {
    profiles: {
      async getByOwnerId(ownerId) {
        return profiles.get(ownerId) ?? null;
      },
      async upsertLatest(ownerId, latestPreferences) {
        const now = new Date().toISOString();
        const document: StoredProfile = {
          ownerId,
          latestPreferences,
          createdAt: profiles.get(ownerId)?.createdAt ?? now,
          updatedAt: now,
        };
        profiles.set(ownerId, document);
        return document;
      },
    },
    plans: {
      async listByOwnerId(ownerId, limit = 10) {
        return Array.from(plans.values())
          .filter((plan) => plan.ownerId === ownerId)
          .sort((left, right) => right.result.createdAt.localeCompare(left.result.createdAt))
          .slice(0, limit)
          .map((plan) => plan.summary);
      },
      async getByIdForOwner(id, ownerId) {
        const document = plans.get(id);
        if (!document || document.ownerId !== ownerId) {
          return null;
        }

        return document;
      },
      async create(ownerId, result, summary) {
        const id = result.id || new ObjectId().toString();
        const document: StoredPlan = {
          id,
          ownerId,
          result: {
            ...result,
            id,
          },
          summary: {
            ...summary,
            id,
          },
        };
        plans.set(id, document);
        return document;
      },
    },
  };
}
