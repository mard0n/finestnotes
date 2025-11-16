import * as schema from "../db/schema";

type AuthorType = {
  id: string;
  name: string;
};

type DBNoteType = typeof schema.notes.$inferSelect;

type NoteBaseType = {
  id: string;
  title: string;
  createdAt: string;
  isPublic: boolean;
  author: AuthorType;
  likeCount: number;
  commentCount: number;
  projects: ProjectType[];
};

export type AnnotationType = NoteBaseType & {
  type: "page";
  annotations?: (
    | typeof schema.highlights.$inferSelect
    | typeof schema.images.$inferSelect
  )[];
} & Pick<DBNoteType, "url" | "description">;

export type WritingType = NoteBaseType & {
  type: "note";
} & Pick<DBNoteType, "content" | "contentHTML" | "contentLexical">;

export type NoteType = AnnotationType | WritingType;
export type ProjectType = {
  id: string;
  name: string;
  createdAt: string;
  isPublic: boolean;
  author: AuthorType;
};
export type ProjectWithNotesType = ProjectType & { notes: NoteType[] };

type BaseNoteWithRelations = typeof schema.notes.$inferSelect & {
  author: typeof schema.user.$inferSelect;
  likes: (typeof schema.likes.$inferSelect)[];
  comments: (typeof schema.comments.$inferSelect)[];
  highlights?: (typeof schema.highlights.$inferSelect)[];
  images?: (typeof schema.images.$inferSelect)[];
  projectsToNotes: (typeof schema.projectsToNotes.$inferSelect & {
    project: typeof schema.projects.$inferSelect & {
      author: typeof schema.user.$inferSelect;
    };
  })[];
};

export function normalizeNotesNew(notes: BaseNoteWithRelations[]) {
  const notesData = notes.map((note) => {
    const {
      projectsToNotes,
      likes,
      comments,
      author: authorData,
      authorId,
      ...rest
    } = note;
    const likeCount = likes.length;
    const commentCount = comments.length;

    const projects: ProjectType[] =
      projectsToNotes.map((pn) => ({
        id: pn.project.id,
        name: pn.project.name,
        isPublic: pn.project.isPublic,
        createdAt: pn.project.createdAt,
        author: {
          id: pn.project.author.id,
          name: pn.project.author.name,
        },
      })) || [];

    const author = {
      id: authorData.id,
      name: authorData.name,
    };

    return {
      ...rest,
      author,
      likeCount,
      commentCount,
      projects,
    };
  });

  const writingsData = notesData
    .filter((article) => article.type === "note")
    .map(({ type, description, url, highlights, images, ...note }) => ({
      ...note,
      type: "note" as const,
    }));

  const annotationsData = notesData
    .filter((article) => article.type === "page")
    .map(
      ({
        type,
        content,
        contentHTML,
        contentLexical,
        highlights,
        images,
        ...page
      }) => {
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
      }
    );

  const allNotes = [...writingsData, ...annotationsData];
  allNotes.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return allNotes;
}

type BaseProject = typeof schema.projects.$inferSelect & {
  author: typeof schema.user.$inferSelect;
  projectsToNotes: (typeof schema.projectsToNotes.$inferSelect & {
    note: typeof schema.notes.$inferSelect & {
      author: typeof schema.user.$inferSelect;
      likes: (typeof schema.likes.$inferSelect)[];
      comments: (typeof schema.comments.$inferSelect)[];
    };
  })[];
};

export function normalizeProjectNew(
  projects: BaseProject[]
): ProjectWithNotesType[] {
  const normalizedProjects = projects.map((project) => {
    const { projectsToNotes, author, authorId, ...rest } = project;

    const notes = projectsToNotes.map((pn) => pn.note) || [];
    // const normalizeNotes = normalizeNotesNew(notes);
    const notesData = notes.map((note) => {
      const { likes, comments, author: authorData, authorId, ...rest } = note;
      const likeCount = likes.length;
      const commentCount = comments.length;

      const author = {
        id: authorData.id,
        name: authorData.name,
      };

      return {
        ...rest,
        author,
        likeCount,
        commentCount,
        projects,
      };
    });

    const writingsData = notesData
      .filter((article) => article.type === "note")
      .map(({ type, url, description, ...note }) => ({
        ...note,
        type: "note" as const,
      }));

    const annotationsData = notesData
      .filter((article) => article.type === "page")
      .map(({ type, content, contentHTML, contentLexical, ...page }) => {
        return {
          ...page,
          type: "page" as const,
        };
      });

    const allNotes = [...writingsData, ...annotationsData];
    allNotes.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      ...rest,
      author: {
        id: author.id,
        name: author.name,
      },
      notes: allNotes,
    };
  });
  return normalizedProjects;
}