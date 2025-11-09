import type { User } from "better-auth";
import { type Note } from "./Notes";
import AnnotationViewer from "./editors-viewers/AnnotationViewer";
import NoteViewer from "./editors-viewers/NoteViewer";
import AnnotationEditor from "./editors-viewers/AnnotationEditor";
import NoteEditor from "./editors-viewers/NoteEditor";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@utils/api";
import { parseResponse } from "hono/client";
import ProjectAddIcon from "@assets/project-add.svg?react";
import TrashIcon from "@assets/trash.svg?react";
import GlobeIcon from "@assets/globe.svg?react";
import LockIcon from "@assets/lock.svg?react";
import AddToProjectDropdown from "./modals-dropdowns/AddToProjectDropdown";

const SelectedNoteEditor: React.FC<{
  user: User;
  selectedNote: Note | null;
  setSelectedNoteId: React.Dispatch<React.SetStateAction<string | null>>;
}> = ({ user, selectedNote, setSelectedNoteId }) => {
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

  const updateNoteVisibility = useMutation({
    mutationFn: async ({ id, isPublic }: { id: string; isPublic: boolean }) => {
      const res = await client.api.note[":id"].visibility.$put({
        param: { id: id.toString() },
        json: { isPublic },
      });
      return await parseResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.note[":id"].$delete({
        param: { id: id.toString() },
      });
      return await parseResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setSelectedNoteId(null);
    },
  });

  const handleDeleteClick = () => {
    if (
      selectedNote &&
      window.confirm(
        `Are you sure you want to delete "${
          selectedNote.title || "Untitled note"
        }"?`
      )
    ) {
      deleteNote.mutate(selectedNote.id);
    }
  };

  const handleVisibilityChange = (isPublic: boolean) => {
    if (selectedNote) {
      updateNoteVisibility.mutate({ id: selectedNote.id, isPublic });
    }
  };

  if (!selectedNote) {
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

  if (selectedNote.author.id !== user.id) {
    return (
      <>
        <EditorNavBar user={user} />
        <div className="px-6 md:px-8 py-6">
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
      <div className="px-6 md:px-8 py-6">
        <div className="hidden md:block">
          <NoteActionBar
            idSuffix="-desktop"
            selectedNote={selectedNote}
            handleVisibilityChange={handleVisibilityChange}
            handleDeleteClick={handleDeleteClick}
          />
        </div>
        <input
          key={selectedNote.id}
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
              id: selectedNote.id,
              title: e.target.value,
            });
          }}
          defaultValue={selectedNote.title}
          placeholder="Untitled note"
        />
        {selectedNote.type === "page" ? (
          <AnnotationEditor annotation={selectedNote} />
        ) : (
          <NoteEditor note={selectedNote} />
        )}
        <div className="block md:hidden absolute bottom-0 left-0 w-full p-4 bg-white border-t border-neutral-300">
          <NoteActionBar
            idSuffix="-mobile"
            selectedNote={selectedNote}
            handleVisibilityChange={handleVisibilityChange}
            handleDeleteClick={handleDeleteClick}
          />
        </div>
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

const NoteActionBar: React.FC<{
  idSuffix: string;
  selectedNote: Note;
  handleVisibilityChange: (isPublic: boolean) => void;
  handleDeleteClick: () => void;
}> = ({
  idSuffix,
  selectedNote,
  handleVisibilityChange,
  handleDeleteClick,
}) => {
  if (!selectedNote) {
    return null;
  }

  return (
    <div className="flex justify-between items-center gap-3 mb-2 lg:mb-6">
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
              noteProjectIds={selectedNote.projects.map(
                (project) => project.id
              )}
            />
          </div>
        </div>
        <div className="dropdown dropdown-top md:dropdown-bottom">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-sm rounded-full bg-white font-normal truncate"
          >
            <span>{selectedNote.isPublic ? <GlobeIcon /> : <LockIcon />}</span>
            <span className="hidden xs:inline">
              {selectedNote.isPublic ? "Public" : "Private"}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-5"
            >
              <path
                fillRule="evenodd"
                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div tabIndex={-1} className="dropdown-content p-2 z-1">
            <ul className="menu p-2 bg-white border border-neutral-300">
              <li>
                <div className="flex gap-3 items-center">
                  <input
                    type="radio"
                    id={`private${idSuffix}`}
                    name={`visibility${idSuffix}`}
                    className="radio radio-xs"
                    checked={!selectedNote.isPublic}
                    onChange={() => handleVisibilityChange(false)}
                  />
                  <label
                    htmlFor={`private${idSuffix}`}
                    className="flex gap-1 items-center cursor-pointer"
                  >
                    <LockIcon /> Private
                  </label>
                </div>
              </li>
              <li>
                <div className="flex gap-3 items-center">
                  <input
                    type="radio"
                    id={`public${idSuffix}`}
                    name={`visibility${idSuffix}`}
                    className="radio radio-xs"
                    checked={selectedNote.isPublic}
                    onChange={() => handleVisibilityChange(true)}
                  />
                  <label
                    htmlFor={`public${idSuffix}`}
                    className="flex gap-1 items-center cursor-pointer"
                  >
                    <GlobeIcon /> Public
                  </label>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <button
        className="btn btn-error btn-sm rounded-full bg-white text-red-500 font-normal truncate"
        onClick={handleDeleteClick}
      >
        <TrashIcon />
        <span className="hidden xs:inline">Delete</span>
      </button>
    </div>
  );
};

export default SelectedNoteEditor;
