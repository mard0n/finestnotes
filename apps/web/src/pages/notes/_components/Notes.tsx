import { useEffect, useState } from "react";
import NoteList from "./NoteList";
import Sidebar from "./Sidebar";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { client } from "@utils/api";
import { parseResponse, type InferResponseType } from "hono/client";
import SelectedNoteEditor from "./SelectedNoteEditor";
import type { User } from "better-auth";
import NotesLayout from "./NotesLayout";

export type FilterType =
  | {
      type: "all" | "private" | "public";
      name: "Public Notes" | "Private Notes" | "All Notes";
    }
  | { type: "project"; id: string; name: string };

export type Note = InferResponseType<typeof client.api.note.$get, 200>[number];

const queryClient = new QueryClient();

const NotesWrapper: React.FC<{ user: User }> = ({ user }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <Notes user={user} />
    </QueryClientProvider>
  );
};

const Notes: React.FC<{ user: User }> = ({ user }) => {
  const [filter, setFilter] = useState<FilterType>({
    type: "all",
    name: "All Notes",
  });
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const { data: notes, isLoading: isLoadingNotes } = useQuery({
    queryKey: ["notes", filter],
    queryFn: async () => {
      if (filter.type !== "project") {
        const res = await client.api.note.$get();
        const notes = await parseResponse(res);
        if (filter.type === "private") {
          return notes.filter((note) => !note.isPublic);
        } else if (filter.type === "public") {
          return notes.filter((note) => note.isPublic);
        }
        return notes;
      } else {
        const res = await client.api.note.project[":id"].$get({
          param: { id: filter.id },
        });
        const project = await parseResponse(res);
        return project?.notes;
      }
    },
  });

  console.log("notes", notes);
  console.log("selectedNoteId", selectedNoteId);

  const selectedNote =
    notes?.find((note) => note.id === selectedNoteId) || null;

  return (
    <NotesLayout
      filter={filter}
      selectedNoteId={selectedNoteId}
      deselectNote={() => setSelectedNoteId(null)}
      sidebar={<Sidebar filter={filter} setFilter={setFilter} user={user} />}
      noteList={
        <NoteList
          filter={filter}
          setFilter={setFilter}
          user={user}
          noteList={notes}
          isLoadingNotes={isLoadingNotes}
          selectedNoteId={selectedNoteId}
          setSelectedNoteId={setSelectedNoteId}
        />
      }
      editor={
        <SelectedNoteEditor
          user={user}
          selectedNote={selectedNote}
          setSelectedNoteId={setSelectedNoteId}
        />
      }
    />
  );
};

export default NotesWrapper;
