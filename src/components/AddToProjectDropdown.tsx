import React, { useRef, useState } from "react";
import { client } from "@utils/api";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import SearchIcon from "@assets/search.svg?react";
import PlusIcon from "@assets/plus.svg?react";

const AddToProjectDropdownWrapper: React.FC<{
  noteId: string;
  onProjectsChange?: () => void;
  onNoteAddedOrRemoved?: () => void;
  queryClient?: QueryClient;
}> = ({ noteId, onProjectsChange, onNoteAddedOrRemoved, queryClient }) => {
  const queryClientInstance = queryClient || new QueryClient();
  return (
    <QueryClientProvider client={queryClientInstance}>
      <AddToProjectDropdown
        noteId={noteId}
        onProjectsChange={onProjectsChange}
        onNoteAddedOrRemoved={onNoteAddedOrRemoved}
      />
    </QueryClientProvider>
  );
};

const AddToProjectDropdown: React.FC<{
  noteId: string;
  onProjectsChange?: () => void;
  onNoteAddedOrRemoved?: () => void;
}> = ({ noteId, onProjectsChange, onNoteAddedOrRemoved }) => {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  const { data: allMyProjects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await client.api.user.projects.$get();
      return await parseResponse(res);
    },
  });

  const { data: projectsWithThisNote = [] } = useQuery({
    queryKey: ["projects", noteId],
    queryFn: async () => {
      const res = await client.api.notes[":id"].projects.$get({
        param: { id: noteId },
      });
      return await parseResponse(res);
    },
  });

  const { mutate: addNoteToProject } = useMutation({
    mutationFn: async ({
      noteId,
      projectId,
    }: {
      noteId: string;
      projectId: string;
    }) => {
      const res = await client.api.projects[":id"].notes.$post({
        param: { id: projectId },
        json: { noteId },
      });
      return await parseResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onNoteAddedOrRemoved?.();
    },
  });

  const { mutate: deleteNoteFromProject } = useMutation({
    mutationFn: async ({
      noteId,
      projectId,
    }: {
      noteId: string;
      projectId: string;
    }) => {
      const res = await client.api.projects[":id"].notes[":noteId"].$delete({
        param: { id: projectId, noteId },
      });
      return await parseResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onNoteAddedOrRemoved?.();
    },
  });

  const { mutate: createProject, isPending: isCreating } = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      isPublic: boolean;
    }) => {
      const response = await client.api.projects.$post({ json: data });
      return await parseResponse(response);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      // Automatically add the note to the newly created project
      addNoteToProject({ projectId: data.project.id, noteId });
      setSearch("");
      onProjectsChange?.();
    },
  });

  const filteredProjects = allMyProjects.filter((project) =>
    project.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const projectExists = allMyProjects.some(
    (project) => project.name.toLowerCase() === search.trim().toLowerCase()
  );

  const canCreateProject = search.trim() !== "" && !projectExists;

  const handleCreateProject = () => {
    if (canCreateProject) {
      createProject({ name: search, description: "", isPublic: false });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!filteredProjects) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (selectedIndex === -1) {
        // Move from input to first item
        setSelectedIndex(0);
      } else if (selectedIndex < filteredProjects.length - 1) {
        setSelectedIndex(selectedIndex + 1);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (selectedIndex > 0) {
        setSelectedIndex(selectedIndex - 1);
      } else if (selectedIndex === 0) {
        // Move back to input
        setSelectedIndex(-1);
        inputRef.current?.focus();
      }
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const project = filteredProjects[selectedIndex];
      toggleProject(project!.id);
    } else if (e.key === "Escape") {
      e.preventDefault();
    }
  };

  const toggleProject = (projectId: string) => {
    if (projectsWithThisNote.some((project) => project.id === projectId)) {
      deleteNoteFromProject({ projectId, noteId });
    } else {
      addNoteToProject({ projectId, noteId });
    }
  };

  return (
    <div
      className="bg-base-100 px-4 py-3 shadow-sm w-full"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={handleKeyDown}
    >
      <h3 className="text-lg font-medium mb-3">Add to project</h3>

      <label className="input input-bordered input-sm flex items-center gap-2 mb-2 w-full">
        <SearchIcon />
        <input
          ref={inputRef}
          type="search"
          name="search"
          id="project-search"
          className="grow"
          placeholder="Search or create new projects"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedIndex(-1);
          }}
          autoFocus
        />
      </label>

      {search && (
        <button
          className="btn btn-sm btn-outline w-full mb-2 truncate"
          onClick={handleCreateProject}
          disabled={!canCreateProject || isCreating}
        >
          {isCreating ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              Creating...
            </>
          ) : projectExists ? (
            `Project "${search}" already exists`
          ) : (
            <>
              <PlusIcon />
              Create project "{search}"
            </>
          )}
        </button>
      )}

      <ul
        ref={listRef}
        className="menu bg-base-100 w-full max-h-64 overflow-y-auto p-0"
      >
        {filteredProjects && filteredProjects.length > 0 ? (
          filteredProjects.map((project, index) => (
            <li
              key={project.id}
              className={selectedIndex === index ? "bg-base-200" : ""}
            >
              <label className="label cursor-pointer justify-start gap-2 px-2 text-base-content ">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={projectsWithThisNote.some(
                    (p) => p.id === project.id
                  )}
                  onChange={() => toggleProject(project.id)}
                />
                <span className="text-lg">
                  {project.isPublic ? "🌐" : "🔒"}
                </span>
                <span className="label-text">{project.name}</span>
              </label>
            </li>
          ))
        ) : (
          <li className="p-4 text-center text-base-content">
            {search ? "No projects found" : "No projects available"}
          </li>
        )}
      </ul>
    </div>
  );
};

export default AddToProjectDropdownWrapper;
