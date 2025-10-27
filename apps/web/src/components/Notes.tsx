import React, { useEffect, useState, useRef } from "react";
import { client } from "@utils/api";
import type { User } from "better-auth";
import { parseResponse, type InferResponseType } from "hono/client";
import NoteEditor from "./NoteEditor";
import AnnotationEditor from "./AnnotationEditor";
import {
  AddToProjectDropdownContent,
  CreateProjectModal,
} from "./ProjectModals";
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

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

type FilterCategory = "private" | "public" | "all" | "project";

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
    null
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
    const noteId = urlParams.get('noteId');
    const projectId = urlParams.get('projectId');

    if (noteId) {
      setSelectedNoteId(noteId);
      // Clear URL parameters after reading
      window.history.replaceState({}, '', '/notes');
    } else if (projectId) {
      setFilterCategory('project');
      setSelectedProjectId(projectId);
      // Clear URL parameters after reading
      window.history.replaceState({}, '', '/notes');
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
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
          />
        </div>
        <div className="w-sm overflow-y-scroll shrink-0 py-6 border-r border-neutral-200">
          <NoteList
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

const Navbar: React.FC<{ user: User | null }> = ({ user }) => {
  return (
    <nav className="flex items-stretch border-b border-neutral-200">
      <div className="w-xs border-r border-neutral-200 pl-8 pr-6 py-4 flex items-center">
        <a href="/" className="">
          Finest
        </a>
      </div>
      <div className="w-sm border-r border-neutral-200 px-6 py-4 flex gap-3 items-center justify-between">
        <label className="input input-ghost !outline-offset-0 w-full rounded-full bg-white">
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
          />
        </label>
        <button title="Create a new note">
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
      <div className="flex grow gap-10 items-center justify-end px-8 py-4">
        {!!user ? (
          <>
            <a href="/notes">my notes</a>
            <div className="dropdown dropdown-hover dropdown-end">
              <span tabIndex={0} role="link" className="m-1">
                {user.name}
              </span>
              <div className="dropdown-content menu  z-1 w-52 p-2">
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
                    <a id="signout">Sign out</a>
                  </li>
                </ul>
              </div>
            </div>
          </>
        ) : (
          <>
            <a href="/login">Login</a>
          </>
        )}
      </div>
    </nav>
  );
};

const SideBar: React.FC<{
  filterCategory: FilterCategory;
  setFilterCategory: React.Dispatch<React.SetStateAction<FilterCategory>>;
  selectedProjectId: string | null;
  setSelectedProjectId: React.Dispatch<React.SetStateAction<string | null>>;
}> = ({
  filterCategory,
  setFilterCategory,
  selectedProjectId,
  setSelectedProjectId,
}) => {
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await client.api.projects.$get();
      return await parseResponse(res);
    },
  });

  const { mutate: renameProject } = useMutation({
    mutationFn: async ({
      projectName,
      projectId,
    }: {
      projectName: string;
      projectId: string;
    }) => {
      const res = await client.api.projects[":id"].$put({
        param: { id: projectId },
        json: { name: projectName },
      });
      return await parseResponse(res);
    },
    onSuccess: (data, variables) => {
      console.log("renamed");
      queryClient.invalidateQueries({ queryKey: ["projects"], exact: false });
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });
    },
  });

  const { mutate: changeVisibility } = useMutation({
    mutationFn: async ({
      projectId,
      isPublic,
    }: {
      projectId: string;
      isPublic: boolean;
    }) => {
      const res = await client.api.projects[":id"].$put({
        param: { id: projectId },
        json: { isPublic },
      });
      return await parseResponse(res);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"], exact: false });
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });
    },
  });

  const { mutate: deleteProject } = useMutation({
    mutationFn: async (projectId: string) => {
      const res = await client.api.projects[":id"].$delete({
        param: { id: projectId },
      });
      return await parseResponse(res);
    },
    onSuccess: (data, projectId) => {
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
        setFilterCategory("all");
      }
      queryClient.invalidateQueries({ queryKey: ["projects"], exact: false });
      queryClient.invalidateQueries({
        queryKey: ["collections"],
        exact: false,
      });
    },
  });

  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] =
    useState(false);
  const [isProjectRenaming, setIsProjectRenaming] = useState<string | false>(
    false
  );

  const handleDeleteProject = (projectId: string, projectName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${projectName}"? This action cannot be undone.`
      )
    ) {
      deleteProject(projectId);
    }
  };

  const handleChangeVisibility = (
    projectId: string,
    currentIsPublic: boolean
  ) => {
    changeVisibility({
      projectId,
      isPublic: !currentIsPublic,
    });
  };

  return (
    <>
      <ul className="mb-6">
        <li>
          <button
            onClick={() => setFilterCategory("all")}
            className={`text-md cursor-pointer hover:text-black w-full text-left ${
              filterCategory === "all"
                ? "font-medium text-black"
                : "font-normal"
            }`}
          >
            All notes
          </button>
          <ul className="flex flex-col gap-2 ml-5 mt-3">
            <li>
              <button
                onClick={() => setFilterCategory("public")}
                className={`text-sm cursor-pointer hover:text-black w-full text-left ${
                  filterCategory === "public"
                    ? "font-medium text-black"
                    : "font-normal"
                }`}
              >
                Public notes
              </button>
            </li>
            <li>
              <button
                onClick={() => setFilterCategory("private")}
                className={`text-sm cursor-pointer hover:text-black w-full text-left ${
                  filterCategory === "private"
                    ? "font-medium text-black"
                    : "font-normal"
                }`}
              >
                Private notes
              </button>
            </li>
          </ul>
        </li>
      </ul>

      <ul>
        <li className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-md">Projects</span>
            <button
              onClick={() => setIsCreateProjectModalOpen(true)}
              className="btn btn-xs btn-ghost"
              title="Create new project"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="size-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            </button>
          </div>
          {projectsLoading ? (
            <p className="text-sm text-gray-content ml-5">Loading...</p>
          ) : projects && projects.length > 0 ? (
            <ul className="flex flex-col gap-2 ml-5">
              {projects.map((project) => (
                <li key={project.id} className="flex justify-between">
                  {isProjectRenaming === project.id ? (
                    <input
                      type="text"
                      defaultValue={project.name}
                      className="input input-sm w-full max-w-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setIsProjectRenaming(false);
                          renameProject({
                            projectName: e.currentTarget.value,
                            projectId: project.id,
                          });
                        }
                      }}
                      onBlur={(e) => {
                        setIsProjectRenaming(false);
                        renameProject({
                          projectName: e.target.value,
                          projectId: project.id,
                        });
                      }}
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setFilterCategory("project");
                        setSelectedProjectId(project.id);
                      }}
                      className={`text-sm cursor-pointer hover:text-black w-full text-left ${
                        selectedProjectId === project.id
                          ? "font-medium text-black"
                          : "font-normal"
                      }`}
                    >
                      <span className="text-lg">
                        {project.isPublic ? "🌐 " : "🔒 "}
                      </span>{" "}
                      <span className="align-text-bottom">{project.name}</span>
                    </button>
                  )}
                  <div className="dropdown dropdown-end">
                    <button
                      role="link"
                      className="btn btn-xs btn-ghost text-xs text-gray-content hover:text-black"
                      tabIndex={0}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="size-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
                        />
                      </svg>
                    </button>
                    <div className="menu dropdown-content z-1 w-52 p-2">
                      <ul className="bg-base-100 p-2 shadow-sm" tabIndex={-1}>
                        <li onClick={() => setIsProjectRenaming(project.id)}>
                          <a>Rename</a>
                        </li>
                        <li
                          onClick={() =>
                            handleChangeVisibility(project.id, project.isPublic)
                          }
                        >
                          <a>
                            Make it{" "}
                            {project.isPublic ? "Private 🔒" : "Public 🌐"}
                          </a>
                        </li>
                        <li
                          className="text-red-400"
                          onClick={() =>
                            handleDeleteProject(project.id, project.name)
                          }
                        >
                          <a>Delete</a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-content ml-5">No projects yet</p>
          )}
        </li>
      </ul>

      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
      />
    </>
  );
};

const NoteList: React.FC<{
  collections: Collections;
  filterCategory: FilterCategory;
  selectedProjectId: string | null;
  selectedNoteId: string | null;
  setSelectedNoteId: React.Dispatch<React.SetStateAction<string | null>>;
}> = ({
  collections,
  filterCategory,
  selectedProjectId,
  selectedNoteId,
  setSelectedNoteId,
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
                    collection.createdAt
                  ).toLocaleDateString()}
                  authorName={collection.user.name}
                  selectedNoteId={selectedNoteId}
                  projectNames={collection.projects.map(
                    (project) => project.name
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
    return (
      <>
        <h1 className="font-medium text-xl mb-6 px-6">
          {project ? project.name : "Project"}
        </h1>
        {project?.notes.length ? (
          <>
            <div className="divider m-0 h-[1px] before:h-[1px] after:h-[1px] before:border-neutral-200 after:border-neutral-200" />
            <ul className="space-y-4 list">
              {project.notes.map((note) => (
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
      <div className="block w-full min-w-0" onClick={() => handleNoteSelection(id)}>
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

const SelectedNoteEditor: React.FC<{
  selectedNote: Collections[number] | undefined;
}> = ({ selectedNote }) => {
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
      queryClient.invalidateQueries({ queryKey: ["collections"] });
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
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });

  console.log("selectedNote", selectedNote);

  return selectedNote ? (
    <>
      <div className="flex">
        <input
          key={selectedNote.id}
          type="text"
          name="title"
          id="title"
          className="text-2xl font-serif outline-none text-black mb-2 grow"
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
        <div className="dropdown dropdown-end">
          <button className="btn btn-ghost btn-sm rounded-full bg-white font-normal mr-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 10.5v6m3-3H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
              />
            </svg>
            Add to project
          </button>
          <div className="dropdown-content menu z-1 p-2 w-xs">
            <AddToProjectDropdownContent
              noteId={selectedNote.id}
              noteProjectIds={selectedNote.projects.map(
                (project) => project.id
              )}
            />
          </div>
        </div>
        <select
          name="visibility"
          className="select select-ghost bg-white select-sm w-24 rounded-full cursor-pointer transition hover:border-gray-light/50"
          defaultValue={selectedNote.isPublic ? "public" : "private"}
          onChange={(e) => {
            const isPublic = e.target.value === "public";

            updateNoteVisibility.mutate({
              id: selectedNote.id,
              isPublic,
            });
          }}
        >
          <option disabled={true}>Visibility</option>
          <option value="private">🔒 Private</option>
          <option value="public">🌐 Public</option>
        </select>
      </div>
      {selectedNote.type === "page" ? (
        <AnnotationEditor annotation={selectedNote} />
      ) : (
        <NoteEditor note={selectedNote} />
      )}
    </>
  ) : (
    <div className="flex justify-center items-center h-full">
      <span className="text-gray-light select-none">No note selected</span>
    </div>
  );
};

export default Notes;
