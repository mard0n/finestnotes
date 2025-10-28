import { useQuery } from "@tanstack/react-query";
import { client } from "@utils/api";
import type { User } from "better-auth";
import { parseResponse } from "hono/client";
import type { Collections, FilterCategory } from "..";

const NoteList: React.FC<{
  user: User;
  collections: Collections;
  filterCategory: FilterCategory;
  selectedProjectId: string | null;
  selectedNoteId: string | null;
  setSelectedNoteId: React.Dispatch<React.SetStateAction<string | null>>;
  searchQuery: string;
}> = ({
  user,
  collections,
  filterCategory,
  selectedProjectId,
  selectedNoteId,
  setSelectedNoteId,
  searchQuery,
}) => {
  const { data: project } = useQuery({
    queryKey: ["project", selectedProjectId],
    queryFn: async () => {
      const res = await client.api.projects[":id"].$get({
        param: { id: selectedProjectId! },
      });
      return await parseResponse(res);
    },
    enabled: selectedProjectId !== null,
  });

  const handleNoteSelection = (noteId: string) => {
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
      return;
    }
    setSelectedNoteId(noteId);
  };

  if (filterCategory !== "project") {
    const filteredCollections = collections?.filter((collection) => {
      if (filterCategory === "all") return true;
      if (filterCategory === "public") return collection.isPublic;
      if (filterCategory === "private") return !collection.isPublic;
      return false;
    }).filter((collection) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const titleMatch = collection.title.toLowerCase().includes(query);
      const contentMatch = collection.type === "note" 
        ? collection.content?.toLowerCase().includes(query)
        : collection.description?.toLowerCase().includes(query);
      return titleMatch || contentMatch;
    });

    const calculateTitle = () => {
      switch (filterCategory) {
        case "all":
          return "All notes";
        case "private":
          return "Private notes";
        case "public":
          return "Public notes";
        default:
          return "Notes";
      }
    };
    return (
      <>
        <h1 className="font-medium text-xl mb-6 px-6">{calculateTitle()}</h1>
        {filteredCollections?.length ? (
          <>
            <div className="divider m-0 h-[1px] before:h-[1px] after:h-[1px] before:border-neutral-200 after:border-neutral-200" />
            <ul className="space-y-4 list">
              {filteredCollections?.map((collection) => (
                <NoteListItem
                  key={collection.id}
                  id={collection.id}
                  title={collection.title}
                  isPublic={collection.isPublic}
                  description={
                    collection.type === "note"
                      ? collection.content
                      : collection.description
                  }
                  createdAt={new Date(
                    collection.createdAt,
                  ).toLocaleDateString()}
                  authorName={collection.user.name}
                  selectedNoteId={selectedNoteId}
                  projectNames={collection.projects.map(
                    (project) => project.name,
                  )}
                  handleNoteSelection={handleNoteSelection}
                />
              ))}
            </ul>
            <div className="divider m-0 h-[1px] before:h-[1px] after:h-[1px] before:border-neutral-200 after:border-neutral-200" />
          </>
        ) : (
          <>
            <div className="divider m-0 h-[1px] before:h-[1px] after:h-[1px] before:border-neutral-200 after:border-neutral-200" />
            <p className="text-sm text-gray-content p-6">No notes found.</p>
          </>
        )}
      </>
    );
  } else {
    const filteredNotes = project?.notes.filter((note) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const titleMatch = note.title.toLowerCase().includes(query);
      const contentMatch = note.type === "note"
        ? note.content?.toLowerCase().includes(query)
        : note.description?.toLowerCase().includes(query);
      return titleMatch || contentMatch;
    });

    return (
      <>
        <div className="mb-6">
          <h1 className="font-medium text-xl px-6">
            {project ? project.name : "Project"}
          </h1>
          {project?.ownerId !== user.id ? (
            <a
              href={`/users/${project?.ownerId}`}
              className="link link-hover text-sm text-gray-light px-6 mt-1"
            >
              by {project?.owner.name}
            </a>
          ) : null}
        </div>
        {filteredNotes?.length ? (
          <>
            <div className="divider m-0 h-[1px] before:h-[1px] after:h-[1px] before:border-neutral-200 after:border-neutral-200" />
            <ul className="space-y-4 list">
              {filteredNotes.map((note) => (
                <NoteListItem
                  key={note.id}
                  id={note.id}
                  title={note.title}
                  isPublic={note.isPublic}
                  description={
                    note.type === "note" ? note.content : note.description
                  }
                  createdAt={new Date(note.createdAt).toLocaleDateString()}
                  authorName={note.user.name}
                  selectedNoteId={selectedNoteId}
                  projectNames={note.projects.map((project) => project.name)}
                  handleNoteSelection={handleNoteSelection}
                />
              ))}
            </ul>
            <div className="divider m-0 h-[1px] before:h-[1px] after:h-[1px] before:border-neutral-200 after:border-neutral-200" />
          </>
        ) : (
          <>
            <div className="divider m-0 h-[1px] before:h-[1px] after:h-[1px] before:border-neutral-200 after:border-neutral-200" />
            <p className="text-sm text-gray-content p-6">
              No notes found in this project.
            </p>
          </>
        )}
      </>
    );
  }
};

const NoteListItem: React.FC<{
  id: string;
  title: string;
  isPublic: boolean;
  description: string | null;
  createdAt: string;
  authorName: string;
  selectedNoteId: string | null;
  projectNames: string[];
  handleNoteSelection: (id: string) => void;
}> = ({
  id,
  title,
  isPublic,
  description,
  createdAt,
  authorName,
  selectedNoteId,
  projectNames,
  handleNoteSelection,
}) => {
  return (
    <li
      tabIndex={0}
      className={`list-row mb-0 gap-0 after:inset-x-0 after:border-neutral-200 rounded-none px-6 py-3 hover:bg-white/50 cursor-pointer ${
        selectedNoteId === id ? "bg-white" : ""
      }`}
    >
      <div />
      <div
        className="block w-full min-w-0"
        onClick={() => handleNoteSelection(id)}
      >
        <div className="flex items-center gap-2">
          <h2 className="font-medium text-black line-clamp-1 grow">
            {title || <>&nbsp;</>}
          </h2>
          <div className="flex items-center gap-1">
            {isPublic ? (
              <span className="text-xs font-medium">🌐</span>
            ) : (
              <span className="text-xs font-medium">🔒</span>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-content mt-1 line-clamp-1">
          {description || <>&nbsp;</>}
        </p>
        <p className="text-xs text-gray-content mt-1.5">
          <span>{createdAt}</span> · <span>{authorName}</span>{" "}
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
