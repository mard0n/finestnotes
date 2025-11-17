import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@utils/api";
import { parseResponse } from "hono/client";
import PublicNotesIcon from "@assets/globe.svg?react";
import PrivateNotesIcon from "@assets/lock.svg?react";
import type { ProjectType } from "@finest/utils/types";
import type { FilterType } from "../Notes";
import type { User } from "@utils/types";

const ProjectDropdownMenu: React.FC<{
  project: ProjectType;
  user: User;
  filter: FilterType;
  setFilter: React.Dispatch<React.SetStateAction<FilterType>>;
}> = ({ project, user, filter, setFilter }) => {
  const queryClient = useQueryClient();

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
      if (filter.type === "project" && filter.project.id === projectId) {
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
      if (filter.type === "project" && filter.project.id === projectId) {
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
  return project.author.id !== user.id ? (
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
      <li onClick={() => handleChangeVisibility(project.id, project.isPublic)}>
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
        onClick={() => handleDeleteProject(project.id, project.name)}
      >
        <a>Delete</a>
      </li>
    </ul>
  );
};

export default ProjectDropdownMenu;
