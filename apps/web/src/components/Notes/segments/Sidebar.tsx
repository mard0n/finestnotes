import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@utils/api";
import type { User } from "better-auth";
import { parseResponse } from "hono/client";
import { useState } from "react";
import type { FilterCategory } from "..";
import CreateProjectModal from "../components/CreateProjectModal";

const SideBar: React.FC<{
  user: User;
  filterCategory: FilterCategory;
  setFilterCategory: React.Dispatch<React.SetStateAction<FilterCategory>>;
  selectedProjectId: string | null;
  setSelectedProjectId: React.Dispatch<React.SetStateAction<string | null>>;
}> = ({
  user,
  filterCategory,
  setFilterCategory,
  selectedProjectId,
  setSelectedProjectId,
}) => {
  const queryClient = useQueryClient();

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

  const { mutate: unsubscribe } = useMutation({
    mutationFn: async (projectId: string) => {
      const res = await client.api.projects[":id"].subscribers.$delete({
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
    },
  });

  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] =
    useState(false);
  const [isProjectRenaming, setIsProjectRenaming] = useState<string | false>(
    false,
  );

  const handleDeleteProject = (projectId: string, projectName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${projectName}"? This action cannot be undone.`,
      )
    ) {
      deleteProject(projectId);
    }
  };

  const handleChangeVisibility = (
    projectId: string,
    currentIsPublic: boolean,
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
            <ul className="flex flex-col gap-2">
              {projects.map((project) => (
                <li key={project.id} className="flex justify-between group">
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
                      className={`text-sm cursor-pointer hover:text-black w-full text-left truncate ${
                        selectedProjectId === project.id
                          ? "font-medium text-black"
                          : "font-normal"
                      }`}
                    >
                      <span className="text-lg">
                        {project.isPublic ? "🌐 " : "🔒 "}
                      </span>{" "}
                      <span className="align-text-bottom">{project.name}</span>{" "}
                      {project.ownerId === user.id ? (
                        <></>
                      ) : (
                        <a
                          href={`/user/${project.ownerId}`}
                          className="link link-hover text-content-light align-text-bottom"
                        >
                          ({project.owner.name})
                        </a>
                      )}
                    </button>
                  )}
                  <div className="dropdown dropdown-end invisible group-hover:visible">
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
                      {project.ownerId !== user.id ? (
                        <ul className="bg-base-100 p-2 shadow-sm" tabIndex={-1}>
                          <li onClick={() => unsubscribe(project.id)}>
                            <a>Unsubscribe</a>
                          </li>
                        </ul>
                      ) : (
                        <ul className="bg-base-100 p-2 shadow-sm" tabIndex={-1}>
                          <li onClick={() => setIsProjectRenaming(project.id)}>
                            <a>Rename</a>
                          </li>
                          <li
                            onClick={() =>
                              handleChangeVisibility(
                                project.id,
                                project.isPublic,
                              )
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
                      )}
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

export default SideBar;
