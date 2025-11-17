import type { NoteType } from "@finest/utils/types";
import { useQuery } from "@tanstack/react-query";
import { client } from "@utils/api";
import { parseResponse } from "hono/client";
import type { FilterType } from "../Notes";

export const useNotes = ({ filter }: { filter: FilterType }) => {
  const { data: notes, isLoading: isNotesLoading } = useQuery({
    queryKey: ["notes", filter],
    queryFn: async (): Promise<NoteType[]> => {
      switch (filter.type) {
        case "saved":
          const savedRes = await client.api.note.bookmarked.$get();
          return await parseResponse(savedRes);

        case "project":
          const projectNotesRes = await client.api.projects[":id"].notes.$get({
            param: { id: filter.project.id },
          });
          return await parseResponse(projectNotesRes);

        case "all":
        case "private":
        case "public":
          const allNotesRes = await client.api.note.$get();
          const allNotes = await parseResponse(allNotesRes);

          if (filter.type === "all") {
            return allNotes;
          }

          return allNotes.filter((note) =>
            filter.type === "private" ? !note.isPublic : note.isPublic
          );

        default:
          return [];
      }
    },
  });
  return { notes, isNotesLoading };
};
