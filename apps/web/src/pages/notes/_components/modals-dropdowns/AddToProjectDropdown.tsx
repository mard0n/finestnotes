import React, { useRef, useState } from "react";
import { client } from "@utils/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseResponse } from "hono/client";

const AddToProjectDropdown: React.FC<{
  noteId: string;
  noteProjectIds: string[];
}> = ({ noteId, noteProjectIds }) => {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await client.api.projects.$get();
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
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
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
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
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
    },
  });

  const filteredProjects = projects?.filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase())
  );

  const projectExists = projects?.some(
    (project) => project.name.toLowerCase() === search.toLowerCase()
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
    if (noteProjectIds.includes(projectId)) {
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
        <svg
          className="h-[1em] opacity-50"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <g
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeWidth="2.5"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </g>
        </svg>
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
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
                  checked={noteProjectIds.includes(project.id)}
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
          <li className="p-4 text-center text-gray-content">
            {search ? "No projects found" : "No projects available"}
          </li>
        )}
      </ul>
    </div>
  );
};

export default AddToProjectDropdown;
