import React, { useEffect, useState, useRef } from "react";
import { client } from "@utils/api";
import type { User } from "better-auth";
import { parseResponse, type InferResponseType } from "hono/client";
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import Navbar from "./components/Navbar";
import SideBar from "./segments/Sidebar";
import NoteList from "./segments/NoteList";
import SelectedNoteEditor from "./segments/SelectedNoteEditor";

export type Collections = InferResponseType<typeof client.api.collections.$get>;
export type Projects = InferResponseType<typeof client.api.projects.$get>;

export const queryClient = new QueryClient();

export const NotePage: React.FC<{ collections: Collections; user: User }> = ({
  collections,
  user,
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <Notes initialCollections={collections} user={user} />
    </QueryClientProvider>
  );
};

export type FilterCategory = "private" | "public" | "all" | "project";

const Notes: React.FC<{ initialCollections: Collections; user: User }> = ({
  initialCollections,
  user,
}) => {
  const {
    isLoading,
    data: collections,
    error,
  } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const res = await client.api.collections.$get();
      return await parseResponse(res);
    },
    initialData: initialCollections,
  });

  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const selectedNote =
    selectedNoteId !== null
      ? collections?.find((c) => c.id === selectedNoteId)
      : undefined;

  // Auto-select note or project from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const noteId = urlParams.get("noteId");
    const projectId = urlParams.get("projectId");

    if (noteId) {
      setSelectedNoteId(noteId);
      // Clear URL parameters after reading
      window.history.replaceState({}, "", "/notes");
    } else if (projectId) {
      setFilterCategory("project");
      setSelectedProjectId(projectId);
      // Clear URL parameters after reading
      window.history.replaceState({}, "", "/notes");
    }

    setIsInitialized(true);
  }, []);

  useEffect(() => {
    // Only clear selections after initialization and when filter category changes
    if (!isInitialized) return;

    if (filterCategory !== "project") {
      setSelectedProjectId(null);
    }

    setSelectedNoteId(null);
  }, [filterCategory, isInitialized]);

  console.log("selectedNote", selectedNote);

  return (
    <>
      <Navbar user={user} />
      <main className="grow overflow-y-hidden flex items-stretch">
        <div className="w-xs overflow-y-scroll shrink-0 pl-8 pr-6 py-6 border-r border-neutral-200">
          <SideBar
            user={user}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
          />
        </div>
        <div className="w-sm overflow-y-scroll shrink-0 py-6 border-r border-neutral-200">
          <NoteList
            user={user}
            collections={collections}
            filterCategory={filterCategory}
            selectedProjectId={selectedProjectId}
            selectedNoteId={selectedNoteId}
            setSelectedNoteId={setSelectedNoteId}
          />
        </div>
        <div className="grow overflow-y-scroll px-8 py-6">
          <SelectedNoteEditor selectedNote={selectedNote} />
        </div>
      </main>
    </>
  );
};
