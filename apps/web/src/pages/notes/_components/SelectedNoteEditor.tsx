import type { User } from "@utils/types";
import { type FilterType } from "./Notes";
import AnnotationViewer from "@components/AnnotationViewer";
import NoteViewer from "@components/NoteViewer";
import AnnotationEditor from "./editors-viewers/AnnotationEditor";
import NoteEditor from "./editors-viewers/NoteEditor";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@utils/api";
import { parseResponse } from "hono/client";
import ProjectAddIcon from "@assets/project-add.svg?react";
import AddToProjectDropdown from "@components/AddToProjectDropdown";
import { useNotes } from "./hooks/useNotes";
import UpvoteButton from "@components/UpvoteButton";
import BookmarkButton from "@components/BookmarkButton";
import NoteVisibilityButton from "@components/NoteVisibilityButton";
import NoteDeleteButton from "@components/NoteDeleteButton";

const SelectedNoteEditor: React.FC<{
  user: User;
  filter: FilterType;
  selectedNoteId: string | null;
  setSelectedNoteId: React.Dispatch<React.SetStateAction<string | null>>;
}> = ({ user, filter, selectedNoteId, setSelectedNoteId }) => {
  const { notes } = useNotes({ filter });

  const queryClient = useQueryClient();

  if (!selectedNoteId || !notes) {
    return (
      <>
        <EditorNavBar user={user} />
        <div className="flex justify-center items-center h-full">
          <span className="text-content-light select-none">
            No note selected
          </span>
        </div>
      </>
    );
  }

  const selectedNote = notes.find((note) => note.id === selectedNoteId)!;

  if (selectedNote.author.id !== user.id) {
    return (
      <>
        <EditorNavBar user={user} />
        <div className="px-6 md:px-8 py-6">
          <div className="mb-6 flex gap-3">
            <UpvoteButton
              noteId={selectedNoteId}
              userId={user.id}
              queryClient={queryClient}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ["notes"] });
              }}
            />
            <BookmarkButton
              noteId={selectedNoteId}
              authorId={selectedNote.author.id}
              userId={user.id}
              queryClient={queryClient}
              onSuccess={() => {
                if (filter.type === "saved") {
                  queryClient.invalidateQueries({ queryKey: ["notes"] });
                }
              }}
            />
          </div>
          <h1 className="text-2xl font-serif outline-none text-black mb-2 grow">
            {selectedNote.title}
          </h1>
          {selectedNote.type === "page" ? (
            <AnnotationViewer annotation={selectedNote} />
          ) : (
            <NoteViewer note={selectedNote} />
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <EditorNavBar user={user} />
      <div className="px-6 md:px-8 py-6 relative">
        <div className="flex justify-between items-center gap-3 mb-2 lg:mb-6 md:static fixed bottom-0 left-0 w-full md:w-auto md:p-0 p-4 md:bg-transparent bg-white md:border-0 border-t border-neutral-300 z-10">
          <div className="flex gap-3">
            <div className="dropdown dropdown-top md:dropdown-bottom">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-sm rounded-full bg-white font-normal truncate"
              >
                <ProjectAddIcon />
                <span className="hidden xs:inline">Add to project</span>
              </div>
              <div tabIndex={-1} className="dropdown-content menu z-1 p-2 w-xs">
                <AddToProjectDropdown
                  noteId={selectedNote.id}
                  queryClient={queryClient}
                />
              </div>
            </div>
            <NoteVisibilityButton
              noteId={selectedNote.id}
              isPublic={selectedNote.isPublic}
              queryClient={queryClient}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ["notes"] });
              }}
            />
            <UpvoteButton
              noteId={selectedNote.id}
              userId={user.id}
              queryClient={queryClient}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ["notes"] });
              }}
            />
          </div>
          <NoteDeleteButton
            noteId={selectedNote.id}
            noteTitle={selectedNote.title}
            queryClient={queryClient}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["notes"] });
              setSelectedNoteId(null);
            }}
          />
        </div>
        <NoteTitleInput
          noteId={selectedNote.id}
          defaultTitle={selectedNote.title}
        />
        {selectedNote.type === "page" ? (
          <AnnotationEditor annotation={selectedNote} />
        ) : (
          <NoteEditor note={selectedNote} />
        )}
      </div>
    </>
  );
};

const EditorNavBar: React.FC<{
  user: User;
}> = ({ user }) => {
  return (
    <div className="hidden md:block pr-4 md:pr-8 py-4 border-b border-neutral-300">
      <div className="flex gap-4 md:gap-10 items-center justify-end h-10">
        <a href="/notes">
          <span className="hidden md:block">my notes</span>
          <span className="block md:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-file-text-icon lucide-file-text"
            >
              <>
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                <path d="M10 9H8" />
                <path d="M16 13H8" />
                <path d="M16 17H8" />
              </>
            </svg>
          </span>
        </a>
        <div className="dropdown dropdown-hover dropdown-end">
          <span
            tabIndex={0}
            role="link"
            className="hidden md:block m-1 max-w-24 truncate"
          >
            {user.name}
          </span>
          <span tabIndex={0} role="link" className="block md:hidden m-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
          </span>
          <div className="dropdown-content menu z-1 w-52 p-2">
            <ul className="bg-base-100 p-2 shadow-sm" tabIndex={-1}>
              <li>
                <a href="/notes">My notes</a>
              </li>
              <li>
                <a href="https://chromewebstore.google.com/">
                  Browser Extension
                </a>
              </li>
              <li>
                <a href="/settings">Settings</a>
              </li>
              <li>
                <a href="/auth/signout" id="signout">
                  Sign out
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const NoteTitleInput: React.FC<{
  noteId: string;
  defaultTitle: string;
}> = ({ noteId, defaultTitle }) => {
  const queryClient = useQueryClient();

  const updateNoteTitle = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const res = await client.api.note[":id"].title.$put({
        param: { id: id.toString() },
        json: { title },
      });
      return await parseResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  return (
    <input
      key={noteId}
      type="text"
      name="title"
      id="title"
      className="block text-2xl font-serif outline-none text-black mb-2 w-full"
      onPaste={(e) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        e.currentTarget.value = text;
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLElement).blur();
        }
      }}
      onBlur={(e) => {
        updateNoteTitle.mutate({
          id: noteId,
          title: e.target.value,
        });
      }}
      defaultValue={defaultTitle}
      placeholder="Untitled note"
    />
  );
};

export default SelectedNoteEditor;
