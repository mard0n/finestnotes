import CreateProjectModal from "./modals-dropdowns/CreateProjectModal.tsx";
import AllNotesIcon from "@assets/all-notes-icon.svg?react";
import PublicNotesIcon from "@assets/globe.svg?react";
import PrivateNotesIcon from "@assets/lock.svg?react";
import SavedNotesIcon from "@assets/bookmark.svg";
import type { FilterType } from "./Notes.tsx";
import type React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@utils/api.ts";
import { parseResponse } from "hono/client";
import type { User } from "better-auth";

const Sidebar: React.FC<{
  filter: FilterType;
  setFilter: React.Dispatch<React.SetStateAction<FilterType>>;
  user: User;
}> = ({ filter, setFilter, user }) => {
  const queryClient = useQueryClient();

  const { data: projects, isLoading: isProjectLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await client.api.projects.$get();
      return await parseResponse(res);
    },
  });

  console.log("projects", projects);

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
      queryClient.invalidateQueries({ queryKey: ["projects"] });
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
      queryClient.invalidateQueries({ queryKey: ["projects"] });
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
      if (filter.type === "project" && filter.id === projectId) {
        setFilter({ type: "all", name: "All Notes" });
      }
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const { mutate: unsubscribe } = useMutation({
    mutationFn: async (projectId: string) => {
      const res = await client.api.projects[":id"].subscribers.$delete({
        param: { id: projectId },
      });
      return await parseResponse(res);
    },
    onSuccess: (data, projectId) => {
      if (filter.type === "project" && filter.id === projectId) {
        setFilter({ type: "all", name: "All Notes" });
      }
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

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
    <div>
      <div className="@4xs/sidebar:px-8 py-4 font-serif font-bold text-xl whitespace-nowrap border-b border-neutral-300">
        <a href="/" className="h-10 flex items-center">
          <span className="block mx-auto @4xs/sidebar:hidden">FN</span>
          <span className="hidden @4xs/sidebar:block">Finest Notes</span>
        </a>
      </div>
      <div className="pt-6 mb-10 px-4 @4xs/sidebar:px-8 flex flex-col gap-3">
        {filterList.map((list) => {
          return (
            <a
              key={list.type}
              onClick={() => {
                setFilter({ type: list.type, name: list.text });
              }}
              className={`link link-hover ${
                filter.type === list.type ? "font-bold" : ""
              } flex items-center justify-center @4xs/sidebar:justify-start gap-2 @max-4xs/sidebar:tooltip @max-4xs/sidebar:tooltip-right`}
              data-tip={list.text}
            >
              <span className="h-6 w-4 flex items-center justify-center">
                {list.icon}
              </span>
              <span className="whitespace-nowrap hidden @4xs/sidebar:inline">
                {list.text}
              </span>
            </a>
          );
        })}
      </div>

      <div className="mb-4 px-4 @4xs/sidebar:pl-8 @4xs/sidebar:pr-6 flex flex-col gap-3">
        <p className="flex justify-between items-center text-md text-content-light mb-1">
          <span className="hidden @4xs/sidebar:inline truncate">Projects</span>
          <CreateProjectModal />
        </p>
        {projects ? (
          projects.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between gap-1 group"
            >
              <div
                className={`flex items-center justify-start gap-2 flex-1 min-w-0 ${
                  filter.type === "project" && filter.id === project.id
                    ? "font-bold"
                    : ""
                }`}
                onClick={() => {
                  setFilter({
                    type: "project",
                    id: project.id,
                    name: project.name,
                  });
                }}
              >
                <div className="block @4xs/sidebar:hidden text-center">
                  {project.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden @4xs/sidebar:flex flex-1 gap-1 items-center min-w-0">
                  <div className="h-6 w-4 flex items-center justify-center flex-shrink-0">
                    {project.isPublic ? (
                      <PublicNotesIcon />
                    ) : (
                      <PrivateNotesIcon />
                    )}
                  </div>
                  <div className="truncate flex-1 min-w-0">{project.name}</div>
                </div>
              </div>
              <div className="hidden group-hover:block h-6 w-[18] dropdown dropdown-end">
                <button
                  role="link"
                  className="btn btn-xs btn-ghost text-xs px-0"
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
                  {project.authorId !== user.id ? (
                    <ul className="bg-base-100 p-2 shadow-sm" tabIndex={-1}>
                      <li onClick={() => unsubscribe(project.id)}>
                        <a>Unsubscribe</a>
                      </li>
                    </ul>
                  ) : (
                    <ul className="bg-base-100 p-2 shadow-sm" tabIndex={-1}>
                      <li
                        onClick={() => {
                          const newName = window.prompt(
                            "Enter new project name:",
                            project.name
                          );
                          if (newName && newName.trim() !== "") {
                            renameProject({
                              projectId: project.id,
                              projectName: newName.trim(),
                            });
                          }
                        }}
                      >
                        <a>Rename</a>
                      </li>
                      <li
                        onClick={() =>
                          handleChangeVisibility(project.id, project.isPublic)
                        }
                      >
                        <a>
                          Make it{" "}
                          {project.isPublic ? (
                            <>
                              Private <PrivateNotesIcon />
                            </>
                          ) : (
                            <>
                              Public <PublicNotesIcon />
                            </>
                          )}
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
                  )}
                </div>
              </div>
            </div>
          ))
        ) : isProjectLoading ? (
          <div className="hidden @4xs/sidebar:block truncate">
            Loading projects...
          </div>
        ) : (
          <div className="hidden @4xs/sidebar:block truncate">
            No projects found.
          </div>
        )}
      </div>
    </div>
  );
};

const filterList = [
  {
    type: "all" as const,
    text: "All Notes" as const,
    icon: <AllNotesIcon />,
  },
  {
    type: "public" as const,
    text: "Public Notes" as const,
    icon: <PublicNotesIcon />,
  },
  {
    type: "private" as const,
    text: "Private Notes" as const,
    icon: <PrivateNotesIcon />,
  },
];

export default Sidebar;
