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
import NotesLayout from "./NotesLayout";
import type { User } from "@utils/types";

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

  const { data: notes, isLoading: isNotesLoading } = useQuery({
    queryKey: ["notes", filter],
    queryFn: async () => {
      if (filter.type !== "project") {
        const res = await client.api.note.$get();
        const notes = await parseResponse(res);
        console.log('notes', notes);
        
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

  const { data: projects, isLoading: isProjectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await client.api.projects.$get();
      return await parseResponse(res);
    },
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const noteId = urlParams.get("noteId");
    const projectId = urlParams.get("projectId");

    if (noteId) {
      const noteExists = notes?.some((note) => note.id === noteId);
      if (!noteExists) return;
      setFilter({ type: "all", name: "All Notes" });
      setSelectedNoteId(noteId);
      window.history.replaceState({}, "", "/notes");
    } else if (projectId) {
      const foundProject = projects?.find((project) => project.id === projectId);
      if (!foundProject) return;
      setFilter({ type: "project", id: projectId, name: foundProject.name });
      window.history.replaceState({}, "", "/notes");
    }
  }, [notes, projects]);


  const selectedNote =
    notes?.find((note) => note.id === selectedNoteId) || null;

  return (
    <NotesLayout
      filter={filter}
      selectedNoteId={selectedNoteId}
      deselectNote={() => setSelectedNoteId(null)}
      sidebar={
        <Sidebar
          filter={filter}
          setFilter={setFilter}
          user={user}
          projects={projects}
          isProjectsLoading={isProjectsLoading}
        />
      }
      noteList={
        <NoteList
          filter={filter}
          setFilter={setFilter}
          user={user}
          notes={notes}
          projects={projects}
          isNotesLoading={isNotesLoading}
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
