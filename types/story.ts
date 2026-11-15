import { z } from "zod";

export const storyChapterSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

export const eventStorySchema = z.object({
  title: z.string().min(1),
  opening: z.string().min(1),
  chapters: z.array(storyChapterSchema).min(2).max(4),
  takeaway: z.string().min(1),
});

export type StoryChapter = z.infer<typeof storyChapterSchema>;

export type EventStory = z.infer<typeof eventStorySchema>;