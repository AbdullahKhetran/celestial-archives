import { z } from "zod";

export function jsonData<T>(data: T, status = 200) {
  return Response.json({ data, error: null }, { status });
}

export function jsonError(status: number, code: string, message: string) {
  return Response.json({ data: null, error: { code, message } }, { status });
}

export function queryMessage(error: z.ZodError) {
  return error.issues.map((issue) => issue.message).join(" ");
}

export const hardwareQuerySchema = z.object({
  mission: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  q: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
});

export function readQuery(request: Request) {
  const url = new URL(request.url);
  const read = (key: string) => {
    const value = url.searchParams.get(key)?.trim();
    return value ? value : undefined;
  };
  return hardwareQuerySchema.safeParse({
    mission: read("mission"),
    type: read("type"),
    q: read("q"),
    body: read("body"),
  });
}

/** Turns a missing database into a 503 the client can explain, and hides other failures. */
export async function withArchive(work: () => Promise<Response>): Promise<Response> {
  try {
    return await work();
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "";
    const empty = /does not exist|not in the database|relation/i.test(message);
    return jsonError(
      empty ? 503 : 500,
      empty ? "database_empty" : "archive_error",
      empty
        ? "The archive database is not ready. Run npm run db:seed."
        : "The archive could not be read.",
    );
  }
}
