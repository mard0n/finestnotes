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

// MARK: For now good enough. Later figure out to make types generic

// type BaseDBNoteType = InferSelectModel<typeof schema.notes>;

// interface BaseNoteInput extends BaseDBNoteType {
//   author: typeof schema.user.$inferSelect;
//   likes?: (typeof schema.likes.$inferSelect)[];
//   comments?: (typeof schema.comments.$inferSelect)[];
//   highlights?: (typeof schema.highlights.$inferSelect)[];
//   images?: (typeof schema.images.$inferSelect)[];
//   projectsToNotes?: (typeof schema.projectsToNotes.$inferSelect & {
//     project: typeof schema.projects.$inferSelect & {
//       author: typeof schema.user.$inferSelect;
//     };
//   })[];
//   // [key: string]: any;
// }

// export interface WritingInput extends BaseNoteInput {
//   type: "note";
//   content: string;
//   contentHTML: string;
//   contentLexical: string;
// }

// export interface AnnotationInput extends BaseNoteInput {
//   type: "page";
//   highlights: (typeof schema.highlights.$inferSelect)[];
//   images: (typeof schema.images.$inferSelect)[];
//   url: string;
//   description: string | null;
// }

// type NoteInput = WritingInput | AnnotationInput;

// type NoteInput = Prettify<BaseNoteInput>;

// type AddLikeCount<T extends NoteInput> = "likes" extends keyof T
//   ? { likeCount: number }
//   : {};

// type AddCommentCount<T extends NoteInput> = "comments" extends keyof T
//   ? { commentCount: number }
//   : {};

// type AddProjects<T extends NoteInput> = "projectsToNotes" extends keyof T
//   ? { projects: ProjectType[] }
//   : {};

// type AddContentType<T extends NoteInput> = T extends WritingInput
//   ? {
//       content: string;
//       contentHTML: string;
//       contentLexical: string;
//     }
//   : T extends AnnotationInput
//   ? {
//       url: string;
//       description: string | null;
//       annotations: (
//         | typeof schema.highlights.$inferSelect
//         | typeof schema.images.$inferSelect
//       )[];
//     }
//   : never;

// type AddContentType<T extends NoteInput> = T extends { type: "note" }
//   ? {
//       content: string;
//       // contentHTML: string;
//       // contentLexical: string;
//     }
//   : T extends { type: "page" }
//   ? {
//       url: string;
//       // description: string | null;
//       // annotations: (
//       //   | typeof schema.highlights.$inferSelect
//       //   | typeof schema.images.$inferSelect
//       // )[];
//     }
//   : { sup: "yooo" };

// type AddContentType<T extends NoteInput> = T["type"] extends "note"
//   ? {
//       content: string;
//       // contentHTML: string;
//       // contentLexical: string;
//     }
//   : T["type"] extends "page"
//   ? {
//       url: string;
//       // description: string | null;
//       // annotations: (
//       //   | typeof schema.highlights.$inferSelect
//       //   | typeof schema.images.$inferSelect
//       // )[];
//     }
//   : { sup: "yooo" };

// type NoteOutput<T extends NoteInput> = {
//   id: string;
//   title: string;
//   createdAt: string;
//   isPublic: boolean;
//   author: AuthorType;
// } & AddLikeCount<T> &
//   AddCommentCount<T> &
//   AddProjects<T> &
//   AddContentType<T>;

// type NoteOutput<T extends NoteInput> = AddContentType<T>;

// export function normalizeNoteNew<T extends NoteInput>(note: T): NoteOutput<T> {
//   const {
//     author,
//     authorId,
//     comments,
//     likes,
//     type,
//     content,
//     contentHTML,
//     contentLexical,
//     highlights,
//     images,
//     url,
//     description,
//     projectsToNotes,
//     id,
//     title,
//     createdAt,
//     isPublic,
//   } = note;

//   const likeCount = likes ? { likeCount: likes.length } : {};
//   const commentCount = comments ? { commentCount: comments.length } : {};

//   const projects = projectsToNotes
//     ? {
//         projects: projectsToNotes.map((pn) => ({
//           id: pn.project.id,
//           name: pn.project.name,
//           isPublic: pn.project.isPublic,
//           createdAt: pn.project.createdAt,
//           author: {
//             id: pn.project.author.id,
//             name: pn.project.author.name,
//           },
//         })),
//       }
//     : {};

//   const noteType =
//     type === "note"
//       ? { type: "note" as const, content, contentHTML, contentLexical }
//       : type === "page"
//         ? {
//             type: "page" as const,
//             url,
//             description,
//             annotations: [...(highlights ?? []), ...(images ?? [])].sort(
//               (a, b) => {
//                 const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
//                 const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
//                 return aTime - bTime;
//               },
//             ),
//           }
//         : {};

//   return {
//     id,
//     title,
//     createdAt,
//     isPublic,
//     author: {
//       id: author.id,
//       name: author.name,
//     },
//     ...likeCount,
//     ...commentCount,
//     ...projects,
//     ...noteType,
//   } as NoteOutput<T>;
// }

// export function normalizeNoteNew<T extends NoteInput>(note: T): NoteOutput<T> {
//   const {
//     id,
//     title,
//     createdAt,
//     isPublic,
//     likes,
//     comments,
//     projectsToNotes,
//     authorId,
//     author: authorData,
//     type,
//     ...rest
//   } = note;

//   const likeCount = likes?.length ?? 0;
//   const commentCount = comments?.length ?? 0;
//   const author = {
//     id: authorData.id,
//     name: authorData.name,
//   };
//   const projects = projectsToNotes?.map((pn) => ({
//     id: pn.project.id,
//     name: pn.project.name,
//     isPublic: pn.project.isPublic,
//     createdAt: pn.project.createdAt,
//     author: {
//       id: pn.project.author.id,
//       name: pn.project.author.name,
//     },
//   }));

//   if (type === "note") {
//     const noteType = {
//       type: "note" as const,
//       content: note.content,
//       contentHTML: note.contentHTML,
//       contentLexical: note.contentLexical,
//       url: "",
//       description: null,
//     };
//     return {
//       id,
//       title,
//       createdAt,
//       isPublic,
//       author,
//       ...noteType,
//       ...(likes ? { likeCount } : {}),
//       ...(comments ? { commentCount } : {}),
//       ...(projectsToNotes ? { projects } : {}),
//     };
//   } else {
//     const noteType = {
//       type: "page" as const,
//       url: note.url,
//       description: note.description,
//       annotations: [...(note.highlights ?? []), ...(note.images ?? [])].sort(
//         (a, b) => {
//           const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
//           const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
//           return aTime - bTime;
//         }
//       ),
//     };
//     return {
//       id,
//       title,
//       createdAt,
//       isPublic,
//       author,
//       ...noteType,
//       ...(likes ? { likeCount } : {}),
//       ...(comments ? { commentCount } : {}),
//       ...(projectsToNotes ? { projects } : {}),
//     };
//   }
// }

// type SeparateNoteFromPage<T extends SimpleNoteInput> = T extends { type: "note" }
//   ? { content: string; }
//   : T extends { type: "page" }
//   ? { url: string; }
//   : { sup: "yooo" };

// MARK: V1. I hate the fact that I need to use casting (as)
// type SimpleInput = {
//   name?: string;
//   [key: string]: any;
// };

// type SimpleOutput<I extends SimpleInput> =
//   I extends { name: string } ? { username: string } & Omit<I, "name"> : Omit<I, "name">;

// export function normalizeSimple<T extends SimpleInput>(
//   note: T
// ): SimpleOutput<T> {
//   if ("name" in note && note.name !== undefined) {
//     const {name, ...rest} = note
//     return { ...rest, username: name } as SimpleOutput<T>
//   }

//   const { name, ...rest } = note;
//   return { ...rest } as SimpleOutput<T>;
// }

// const result1 = normalizeSimple({ name: "example" });
// result1.username
// const result2 = normalizeSimple({ name: "example", id: 1 });
// result2.username
// result2.id
// const result3 = normalizeSimple({ id: 1 });
// result3.id

// MARK: V2
// type SimpleInput = {
//   name?: string;
//   type?: "note" | "page";
//   content?: string | null;
//   highlight?: string[] | null;
//   [key: string]: any;
// };

// type SimpleOutput<I extends SimpleInput> = {} & (I extends { name: string }
//   ? { username: string } & Omit<I, "name">
//   : Omit<I, "name">) &
//   (I extends { type: "note", content: string }
//     ? { type: "note"; content: string } & Omit<I, "highlight">
//     : I extends { type: "page", highlight: string[] }
//     ? { type: "page"; highlight: string[] } & Omit<I, "content">
//     : {});

// export function normalizeSimple<T extends SimpleInput>(
//   note: T
// ): SimpleOutput<T> {
//   const { name, ...rest } = note;
//   const base = name !== undefined ? { username: name, ...rest } : rest;

//   if (note.type === "note") {
//     const { highlight, ...noteRest } = base;
//     return { ...noteRest, type: "note", content: note.content! } as SimpleOutput<T>;
//   } else {
//     const { content, ...pageRest } = base;
//     return { ...pageRest, type: "page", highlight: note.highlight! } as SimpleOutput<T>;
//   }
// }

// const result1 = normalizeSimple({ name: "example" });
// result1.username;
// const result2 = normalizeSimple({ name: "example", id: 1 });
// result2.username;
// result2.id;
// const result3 = normalizeSimple({ id: 1 });
// result3.id;
// const result4 = normalizeSimple({ id: 1, type: 'note' });
// result4.type;
// result4.content;
// const result5 = normalizeSimple({ id: 1, type: 'note', content: "test content" });
// result5.content;
// const result6 = normalizeSimple({ id: 1, type: 'note', content: "test content", highlight: ["qwe"] });
// result6.content;
// result6.highlight; // MARK: Wrong
// TODO: Come back later
