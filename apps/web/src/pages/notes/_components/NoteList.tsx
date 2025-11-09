import type { FilterType, Note } from "./Notes";
import { useState } from "react";
import PublicNotesIcon from "@assets/globe.svg?react";
import PrivateNotesIcon from "@assets/lock.svg?react";
import AuthorName from "@components/AuthorName";
import { formatDate } from "@utils/date";
import type { User } from "better-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@utils/api";
import { parseResponse } from "hono/client";

const NoteList: React.FC<{
  filter: FilterType;
  setFilter: React.Dispatch<React.SetStateAction<FilterType>>;
  user: User;
  noteList: Note[] | undefined;
  isLoadingNotes: boolean;
  selectedNoteId: string | null;
  setSelectedNoteId: React.Dispatch<React.SetStateAction<string | null>>;
}> = ({
  filter,
  setFilter,
  user,
  noteList: notes,
  isLoadingNotes,
  selectedNoteId,
  setSelectedNoteId,
}) => {
  const queryClient = useQueryClient();
  const { mutate: createNewNote } = useMutation({
    mutationFn: async () => {
      const res = await client.api.note.$post({
        json: {
          title: "",
          content: "",
          contentLexical: "",
          contentHTML: "",
        },
      });
      return await parseResponse(res);
    },
    onSuccess: ({ data }) => {
      console.log("New note created:", data);
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setFilter({ type: "all", name: "All Notes" });
      console.log("setSelectedNoteId(data.id)", data.id);
      setSelectedNoteId(data.id);
    },
  });

  const [searchValue, setSearchValue] = useState("");

  let noteList = notes;

  if (searchValue.trim() && noteList?.length) {
    noteList = noteList.filter((note) => {
      const query = searchValue.trim().toLowerCase();
      const titleMatch = note.title.toLowerCase().includes(query);
      const contentMatch =
        note.type === "note"
          ? note.content?.toLowerCase().includes(query)
          : note.description?.toLowerCase().includes(query);
      return titleMatch || contentMatch;
    });
  }

  const handleNoteSelection = (noteId: string) => {
    console.log("noteId", noteId);

    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
      return;
    }

    setSelectedNoteId(noteId);
  };

  const handleNewNoteCreation = () => {
    createNewNote();
  };

  return (
    <>
      <h1 className="block md:hidden font-medium text-xl mt-8 mb-5 px-6 min-h-[28px]">
        {filter.name}
      </h1>
      <div className="w-full pb-4 px-6 md:py-4 flex gap-2 items-center justify-between md:border-b md:border-neutral-300">
        <label className="input input-ghost !outline-offset-0 w-full rounded-full bg-white h-10">
          <svg
            className="h-[1.2em] opacity-50"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <g
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeWidth="2.5"
              fill="none"
              stroke="#4A4846"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </g>
          </svg>
          <input
            type="search"
            name="search"
            className="grow"
            placeholder="Search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </label>
        <button
          title="Create a new note"
          className="h-10 btn btn-ghost px-2"
          onClick={handleNewNoteCreation}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="#4A4846"
            className="size-6 cursor-pointer"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </button>
      </div>

      <h1 className="hidden md:block font-medium text-xl my-6 px-6 min-h-[28px]">
        {filter.name}
      </h1>
      <div className="hidden md:block border-b border-neutral-200" />
      {noteList?.length ? (
        <>
          <ul className="space-y-4 list">
            {noteList.map((note) => (
              <NoteListItem
                key={note.id}
                note={note}
                userId={user.id}
                selectedNoteId={selectedNoteId}
                projectNames={note.projects.map((project) => project.name)}
                handleNoteSelection={handleNoteSelection}
              />
            ))}
          </ul>
          <div className="hidden md:block border-b border-neutral-200" />
        </>
      ) : isLoadingNotes ? (
        <>
          <p className="text-sm text-gray-content p-6">Loading notes...</p>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-content p-6">
            No notes found in this project.
          </p>
        </>
      )}
    </>
  );
};

type PageProps = {
  type: "page";
  description: string | null;
};

type NoteProps = {
  type: "note";
  content: string | null;
};

type NoteListProps = {
  id: string;
  title: string;
  createdAt: string;
  isPublic: boolean;
  author: {
    name: string;
    id: string;
  };
} & (PageProps | NoteProps);

const NoteListItem: React.FC<{
  note: NoteListProps;
  projectNames: string[];
  userId: string | null | undefined;
  selectedNoteId: string | null | undefined;
  handleNoteSelection: (id: string) => void;
}> = ({ note, userId, selectedNoteId, projectNames, handleNoteSelection }) => {
  let description: string | null = null;
  if (note.type === "note") {
    description = note.content;
  } else if (note.type === "page") {
    description = note.description;
  }

  return (
    <li
      tabIndex={0}
      className={`list-row mb-0 gap-0 after:inset-x-0 after:border-neutral-200 rounded-none px-6 py-3 hover:bg-white/50 cursor-pointer ${
        selectedNoteId === note.id ? "bg-white" : ""
      }`}
    >
      <div />
      <div
        className="block w-full min-w-0"
        onClick={() => handleNoteSelection(note.id)}
      >
        <div className="flex items-center gap-2">
          <h2 className="font-medium text-black line-clamp-1 grow">
            {note.title || <>&nbsp;</>}
          </h2>
          <div className="flex items-center gap-1">
            {note.isPublic ? (
              <span className="text-xs font-medium">
                <PublicNotesIcon />
              </span>
            ) : (
              <span className="text-xs font-medium">
                <PrivateNotesIcon />
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-content mt-1 line-clamp-1">
          {description || <>&nbsp;</>}
        </p>
        <p className="text-xs text-gray-content mt-1.5">
          {note.author.id && (
            <>
              <AuthorName
                ownerId={note.author.id}
                ownerName={note.author.name}
                userId={userId}
              />{" "}
              ·{" "}
            </>
          )}
          <span>{formatDate(note.createdAt)}</span>
        </p>
        <div className="mt-2 overflow-x-auto no-scrollbar">
          <ul className="flex gap-2 whitespace-nowrap">
            {projectNames.map((projectName) => (
              <li
                key={projectName}
                className="badge badge-md text-xs text-black badge-outline rounded-full border-base-300 flex-shrink-0"
              >
                {projectName}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
};
export default NoteList;
