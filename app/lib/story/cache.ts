
import "server-only";

import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";

import { ensureDatabase } from "@/app/lib/db";
import { eventStoryCache } from "@/app/lib/db/schema";
import {
  eventStorySchema,
  type EventStory,
} from "@/types/story";

import {
  generateEventStory,
  STORY_MODEL,
  STORY_PROMPT_VERSION,
  type StoryGenerationInput,
} from "./generate";

/**
 * Prevents duplicate Gemini requests for the same event
 * while generation is already running in this server process.
 */
const inFlight = new Map<string, Promise<EventStory>>();

/**
 * Creates a fingerprint of the factual source data.
 * Changes to event, mission, or hardware context invalidate the cache.
 */
function fingerprintSource(input: StoryGenerationInput): string {
  return createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");
}

/**
 * Checks the database cache, generates a story when necessary,
 * and persists the generated JSON in event_story_cache.
 */
async function generateAndSave(
  eventId: string,
  input: StoryGenerationInput,
  sourceFingerprint: string,
): Promise<EventStory> {
  const database = await ensureDatabase();

  // 1. Look for an existing cached story.
  const [cached] = await database
    .select()
    .from(eventStoryCache)
    .where(eq(eventStoryCache.eventId, eventId))
    .limit(1);

  // 2. Return the cached story when every version matches.
  if (
    cached &&
    cached.sourceFingerprint === sourceFingerprint &&
    cached.promptVersion === STORY_PROMPT_VERSION &&
    cached.model === STORY_MODEL
  ) {
    const validated = eventStorySchema.safeParse(cached.story);

    if (validated.success) {
      console.info(`[story-cache] HIT: ${eventId}`);
      return validated.data;
    }

    console.warn(
      `[story-cache] INVALID: Cached story failed validation for ${eventId}`,
    );
  }

  // 3. Generate a new story when the cache is missing or outdated.
  console.info(
    `[story-cache] MISS: ${eventId}. Generating with ${STORY_MODEL}`,
  );

  const story = await generateEventStory(input);

  // 4. Persist the generated JSON.
  // Update the existing row if this event already has a cache entry.
  await database
    .insert(eventStoryCache)
    .values({
      eventId,
      sourceFingerprint,
      promptVersion: STORY_PROMPT_VERSION,
      model: STORY_MODEL,
      story,
    })
    .onConflictDoUpdate({
      target: eventStoryCache.eventId,
      set: {
        sourceFingerprint,
        promptVersion: STORY_PROMPT_VERSION,
        model: STORY_MODEL,
        story,
        generatedAt: new Date(),
      },
    });

  console.info(`[story-cache] SAVED: ${eventId}`);

  return story;
}

/**
 * Public function used by the API route.
 *
 * Retrieves a valid cached story or generates and saves a new one.
 */
export async function getOrGenerateEventStory(
  eventId: string,
  input: StoryGenerationInput,
): Promise<EventStory> {
  const sourceFingerprint = fingerprintSource(input);

  // Include all generation versions in the in-memory request key.
  const requestKey = JSON.stringify([
    eventId,
    sourceFingerprint,
    STORY_PROMPT_VERSION,
    STORY_MODEL,
  ]);

  // 1. Reuse an already-running request for identical input.
  const existing = inFlight.get(requestKey);

  if (existing) {
    console.info(`[story-cache] IN-FLIGHT: ${eventId}`);
    return existing;
  }

  // 2. Start generation or retrieve the database cache.
  const generation = generateAndSave(
    eventId,
    input,
    sourceFingerprint,
  );

  inFlight.set(requestKey, generation);

  try {
    return await generation;
  } finally {
    // 3. Remove the completed request from memory.
    if (inFlight.get(requestKey) === generation) {
      inFlight.delete(requestKey);
    }
  }
}
