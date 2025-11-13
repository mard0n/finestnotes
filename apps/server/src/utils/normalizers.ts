import { Prettify } from "better-auth";
import * as schema from "../db/schema";

type AuthorType = Prettify<
  Pick<typeof schema.user.$inferSelect, "id" | "name">
>;

type ProjectType = Prettify<
  Pick<typeof schema.projects.$inferSelect, "id" | "name" | "authorId"> & {
    authorName: string;
  }
>;

type DBNoteType = typeof schema.notes.$inferSelect;

type NoteBaseType = Prettify<
  Pick<DBNoteType, "id" | "title" | "createdAt" | "isPublic"> & {
    author: AuthorType;
    likeCount?: number;
    commentCount?: number;
    projects?: ProjectType[];
  }
>;

type AnnotationType = Prettify<
  NoteBaseType & {
    type: "page";
    annotations: (
      | typeof schema.highlights.$inferSelect
      | typeof schema.images.$inferSelect
    )[];
  } & Pick<DBNoteType, "url" | "description">
>;

type WritingType = Prettify<
  NoteBaseType & {
    type: "note";
  } & Pick<DBNoteType, "content" | "contentHTML" | "contentLexical">
>;

export type NoteType = AnnotationType | WritingType;

type BaseNoteWithRelations = typeof schema.notes.$inferSelect & {
  author: typeof schema.user.$inferSelect;
  likes?: (typeof schema.likes.$inferSelect)[];
  comments?: (typeof schema.comments.$inferSelect)[];
  highlights?: (typeof schema.highlights.$inferSelect)[];
  images?: (typeof schema.images.$inferSelect)[];
  projectsToNotes?: (typeof schema.projectsToNotes.$inferSelect & {
    project: typeof schema.projects.$inferSelect & {
      author: typeof schema.user.$inferSelect;
    };
  })[];
};

export function normalizeNotesNew(notes: BaseNoteWithRelations[]): NoteType[] {
  const notesData = notes.map((note) => {
    const { projectsToNotes, ...rest } = note;
    const likeCount = note.likes?.length;
    const commentCount = note.comments?.length;
    const projects = projectsToNotes?.map(({ project }) => ({
      id: project.id,
      name: project.name,
      authorId: project.authorId,
      authorName: project.author.name,
    }));

    const author = {
      id: note.author.id,
      name: note.author.name,
    };

    return {
      ...rest,
      author,
      likeCount,
      commentCount,
      projects,
    };
  });

  type WritingType = NoteType & { type: "note" };
  const writingsData: WritingType[] = notesData
    .filter((article) => article.type === "note")
    .map(({ highlights, images, description, likes, ...note }) => ({
      ...note,
      type: "note" as const,
    }));

  type AnnotationType = NoteType & { type: "page" };
  const annotationsData: AnnotationType[] = notesData
    .filter((article) => article.type === "page")
    .map(({ content, contentLexical, highlights, images, likes, ...page }) => {
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

  const allArticles = [...writingsData, ...annotationsData];
  allArticles.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return allArticles;
}
