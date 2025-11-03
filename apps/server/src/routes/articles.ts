import { zValidator } from "@hono/zod-validator";
import { notes } from "../db/schema";
import { and, eq, getTableColumns, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { type Bindings } from "../index";
import z from "zod";
import * as schema from "../db/schema";

import { auth } from "utils/auth";

const articles = new Hono<{ Bindings: Bindings }>()
  // Get all articles
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        page: z.string(),
        limit: z.string().optional().default("20"),
      })
    ),
    async (c) => {
      const { page: pageStr, limit: limitStr } = c.req.valid("query");
      const page = parseInt(pageStr);
      const limit = parseInt(limitStr);
      const offset = (page - 1) * limit;

      const db = drizzle(c.env.finestdb, { schema: schema });

      const notesData = await db.query.notes
        .findMany({
          offset,
          limit,
          with: {
            author: true,
          },
          where: eq(notes.isPublic, true),
        })
        .then(normalizeNotes);

      return c.json(notesData);
    }
  )

  // Get article by ID
  .get(
    "/:id",
    zValidator(
      "param",
      z.object({
        id: z.string(),
      })
    ),
    async (c) => {
      const { id } = c.req.valid("param");
      const session = await auth(c.env).api.getSession({
        headers: c.req.raw.headers,
      });
      const currentUser = session?.user;

      const db = drizzle(c.env.finestdb, { schema });

      // OPTION: Number 1
      // Problem: Couldn't figure out how to filter related and nested projects
      // let article = await db.query.notes.findFirst({
      //   with: {
      //     author: true,
      //     highlights: true,
      //     images: true,
      //     projectsToNotes: {
      //       with: {
      //         project: {
      //           with: { author: true },
      //         },
      //       },
      //       where: // filter projects that are public or owned by the user. Couldn't figure it out
      //     },
      //   },
      //   where: and(eq(notes.id, id), eq(notes.isPublic, true)),
      // });

      // OPTION: Number 2
      // Problem: Aggregation is super complex.
      // https://orm.drizzle.team/docs/joins#aggregating-results
      // const { notes, projectsToNotes, projects, user } = schema;
      // const notesColumns = getTableColumns(notes);
      // let article = await db
      //   .select()
      //   .from(notes)
      //   .leftJoin(projectsToNotes, eq(notes.id, projectsToNotes.noteId))
      //   .leftJoin(projects, eq(projectsToNotes.projectId, projects.id))
      //   .leftJoin(user, eq(notes.authorId, user.id))
      //   .where(
      //     and(
      //       eq(notes.id, id),
      //       eq(notes.isPublic, true),
      //       or(
      //         eq(projects.isPublic, true),
      //         eq(projects.authorId, currentUser?.id || "")
      //       )
      //     )
      //   )
      //   .limit(1);

      // OPTION: Number 3
      // Manual filtering after fetching the article
      let article = await db.query.notes
        .findFirst({
          with: {
            author: true,
            highlights: true,
            images: true,
            projectsToNotes: {
              with: {
                project: {
                  with: { author: true },
                },
              },
            },
          },
          where: and(eq(notes.id, id), eq(notes.isPublic, true)),
        })
        .then((note) => {
          if (!note) return null;
          const { projectsToNotes, ...rest } = note;

          // Return only public or projects owned by the current user
          const publicOrMyProjects =
            projectsToNotes
              ?.filter(
                (pn) =>
                  pn.project.isPublic || pn.project.authorId === currentUser?.id
              )
              .map((pn) => pn.project) ?? [];

          return {
            ...rest,
            projects: publicOrMyProjects,
          };
        })
        .then((article) => article && normalizeNotes([article])[0]);

      if (!article) {
        return c.json(
          {
            success: false,
            message: `Note ${id} not found or is not public.`,
          },
          404
        );
      }

      return c.json(article);
    }
  );

export default articles;

type BaseNoteWithRelations<T extends Record<string, any> = {}> =
  typeof schema.notes.$inferSelect & {
    highlights?: (typeof schema.highlights.$inferSelect)[];
    images?: (typeof schema.images.$inferSelect)[];
  } & T;

type NormalizedNote<T extends Record<string, any> = {}> = Omit<
  BaseNoteWithRelations<T>,
  "highlights" | "images" | "description"
> & {
  type: "note";
};

type NormalizedPage<T extends Record<string, any> = {}> = Omit<
  BaseNoteWithRelations<T>,
  "content" | "contentLexical" | "highlights" | "images"
> & {
  annotations: (
    | typeof schema.highlights.$inferSelect
    | typeof schema.images.$inferSelect
  )[];
  type: "page";
};

type NormalizedArticle<T extends Record<string, any> = {}> =
  | NormalizedNote<T>
  | NormalizedPage<T>;

export function normalizeNotes<T extends Record<string, any> = {}>(
  notes: BaseNoteWithRelations<T>[]
): NormalizedArticle<T>[] {
  const notesData: NormalizedNote<T>[] = notes
    .filter((article) => article.type === "note")
    .map(({ highlights, images, description, ...note }) => ({
      ...note,
      type: "note" as const,
    }));

  const pagesData: NormalizedPage<T>[] = notes
    .filter((article) => article.type === "page")
    .map(({ content, contentLexical, highlights, images, ...page }) => {
      const annotations = [
        ...((highlights ?? []) as (typeof schema.highlights.$inferSelect)[]),
        ...((images ?? []) as (typeof schema.images.$inferSelect)[]),
      ].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime;
      });
      return {
        ...page,
        annotations,
        type: "page" as const,
      };
    });

  const allArticles = [...notesData, ...pagesData];
  allArticles.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return allArticles;
}
