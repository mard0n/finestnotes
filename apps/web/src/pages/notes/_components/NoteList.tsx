import type { FilterType } from "./Notes";
import { useState } from "react";
import PublicNotesIcon from "@assets/globe.svg?react";
import PrivateNotesIcon from "@assets/lock.svg?react";
import AuthorName from "@components/AuthorName";
import { formatDate, pluralize } from "@utils/date";
import type { User } from "@utils/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@utils/api";
import { parseResponse } from "hono/client";
import type { NoteType } from "@finest/utils/types";
import { useNoteSearch } from "./hooks/useSearchNote";
import { useNotes } from "./hooks/useNotes";

const NoteList: React.FC<{
  filter: FilterType;
  setFilter: React.Dispatch<React.SetStateAction<FilterType>>;
  user: User;
  selectedNoteId: string | null;
  setSelectedNoteId: React.Dispatch<React.SetStateAction<string | null>>;
}> = ({ filter, setFilter, user, selectedNoteId, setSelectedNoteId }) => {
  const { notes, isNotesLoading } = useNotes({ filter });

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
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setFilter({ type: "all", name: "All Notes" });
      setSelectedNoteId(data.id);
    },
  });

  const [searchValue, setSearchValue] = useState("");
  const foundSearchedNotes = useNoteSearch(notes, searchValue);

  const handleNoteSelection = (noteId: string) => {
    selectedNoteId === noteId
      ? setSelectedNoteId(null)
      : setSelectedNoteId(noteId);
  };

  const notesToDisplay = foundSearchedNotes ?? notes;

  return (
    <>
      <div className="block md:hidden mt-8 mb-5 px-6">
        <Header filter={filter} user={user} />
      </div>
      <NoteSearchBar
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        onCreateNote={createNewNote}
      />
      <div className="hidden md:block my-6 px-6">
        <Header filter={filter} user={user} />
      </div>
      <div className="hidden md:block border-b border-neutral-200" />
      {notesToDisplay?.length ? (
        <>
          <ul className="space-y-4 list">
            {notesToDisplay.map((note) => (
              <NoteListItem
                key={note.id}
                note={note}
                userId={user.id}
                selectedNoteId={selectedNoteId}
                handleNoteSelection={handleNoteSelection}
              />
            ))}
          </ul>
          <div className="hidden md:block border-b border-neutral-200" />
        </>
      ) : isNotesLoading ? (
        <>
          <p className="text-sm text-base-content p-6">Loading notes...</p>
        </>
      ) : (
        <>
          <p className="text-sm text-base-content p-6">
            No notes found in this project.
          </p>
        </>
      )}
    </>
  );
};

const Header: React.FC<{ filter: FilterType; user: User }> = ({
  filter,
  user,
}) => {
  return (
    <>
      <h1 className="font-medium text-xl min-h-[28px]">
        {filter.type === "project" ? filter.project.name : filter.name}
      </h1>
      {filter.type === "project" ? (
        <p className="text-sm text-content-light">
          <AuthorName
            ownerId={filter.project.author.id}
            ownerName={filter.project.author.name}
            userId={user.id}
            shouldAddBy={true}
          />
        </p>
      ) : null}
    </>
  );
};

const NoteSearchBar: React.FC<{
  searchValue: string;
  setSearchValue: React.Dispatch<React.SetStateAction<string>>;
  onCreateNote: () => void;
}> = ({ searchValue, setSearchValue, onCreateNote }) => (
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
      onClick={onCreateNote}
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
);

const NoteListItem: React.FC<{
  note: NoteType;
  userId: string | null | undefined;
  selectedNoteId: string | null | undefined;
  handleNoteSelection: (id: string) => void;
}> = ({ note, userId, selectedNoteId, handleNoteSelection }) => {
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
        <p className="text-sm text-content-medium mt-1 line-clamp-1">
          {description || <>&nbsp;</>}
        </p>
        <p className="text-xs text-content-light mt-1.5">
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

          <span> · {pluralize(note.likeCount ?? 0, "upvote")}</span>
          <span> · {pluralize(note.commentCount ?? 0, "comment")}</span>
        </p>
        {note.projects ? (
          <div className="mt-2 overflow-x-auto no-scrollbar">
            <ul className="flex gap-2 whitespace-nowrap">
              {note.projects.map((project) => (
                <li
                  key={project.id}
                  className="badge badge-md text-xs text-black badge-outline rounded-full border-base-300 flex-shrink-0"
                >
                  {project.name}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </li>
  );
};
export default NoteList;
