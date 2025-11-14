import { useState } from "react";
import NoteList from "./NoteList";
import Sidebar from "./Sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SelectedNoteEditor from "./SelectedNoteEditor";
import NotesLayout from "./NotesLayout";
import type { User } from "@utils/types";
import CommentSection from "@components/CommentSection";
import type { ProjectType } from "@finest/utils/types";
import { useUrlParamsToSetSelection } from "./hooks/useUrlParamsToSetSelection";

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

  useUrlParamsToSetSelection({
    filter,
    setFilter,
    setSelectedNoteId,
  });

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
          selectedNoteId={selectedNoteId}
          setSelectedNoteId={setSelectedNoteId}
        />
      }
      editor={
        <>
          <SelectedNoteEditor
            user={user}
            filter={filter}
            selectedNoteId={selectedNoteId}
            setSelectedNoteId={setSelectedNoteId}
          />
          {selectedNoteId ? (
            <div className="px-8 mt-20">
              <CommentSection
                noteId={selectedNoteId}
                currentUser={user}
                isOpen={false}
              />
            </div>
          ) : null}
        </>
      }
    />
  );
};

export default NotesWrapper;

export type FilterType =
  | {
      type: "all";
      name: "All Notes";
    }
  | {
      type: "private";
      name: "Private Notes";
    }
  | {
      type: "public";
      name: "Public Notes";
    }
  | {
      type: "saved";
      name: "Saved Notes";
    }
  | { type: "project"; project: ProjectType };
