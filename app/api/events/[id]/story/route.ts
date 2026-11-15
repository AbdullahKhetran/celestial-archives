import { z } from "zod";

import { getOrGenerateEventStory } from "@/app/lib/story/cache";
import { loadStoryGenerationInput } from "@/app/lib/story/context";
import {
  jsonData,
  jsonError,
  withArchive,
} from "@/app/lib/api/http";

const eventIdSchema = z.string().trim().min(1).max(200);

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  const { id } = await context.params;

  const parsedId = eventIdSchema.safeParse(id);

  if (!parsedId.success) {
    return jsonError(
      400,
      "invalid_event_id",
      "A valid event ID is required.",
    );
  }

  const eventId = parsedId.data;

  return withArchive(async () => {
    // 1. Retrieve the selected event and its factual context.
    const input = await loadStoryGenerationInput(eventId);

    if (!input) {
      return jsonError(
        404,
        "event_not_found",
        "No event record has that ID.",
      );
    }

    try {
      // 2. Generate its adaptive story using Gemini.
      const story = await getOrGenerateEventStory(eventId, input);

      // 3. Return the validated storytelling JSON.
      return jsonData({
        eventId,
        story,
      });
    } catch (error) {
      console.error("Event storytelling failed:", error);

      const missingKey =
        error instanceof Error &&
        error.message === "GEMINI_API_KEY is not configured.";

      return jsonError(
        missingKey ? 503 : 502,
        missingKey
          ? "story_service_not_configured"
          : "story_generation_failed",
        missingKey
          ? "The storytelling service is not configured."
          : "Could not generate the event story. Please try again.",
      );
    }
  });
}
