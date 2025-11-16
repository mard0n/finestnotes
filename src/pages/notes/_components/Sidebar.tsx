import CreateProjectModal from "./modals-dropdowns/CreateProjectModal.tsx";
import AllNotesIcon from "@assets/all-notes-icon.svg?react";
import PublicNotesIcon from "@assets/globe.svg?react";
import PrivateNotesIcon from "@assets/lock.svg?react";
import SavedNotesIcon from "@assets/bookmark.svg?react";
import type { FilterType } from "./Notes.tsx";
import type React from "react";
import type { User } from "@utils/types";
import AuthorName from "@components/AuthorName.tsx";
import ProjectDropdownMenu from "./modals-dropdowns/ProjectDropdownMenu.tsx";
import { useProjects } from "./hooks/useProjects.ts";

const Sidebar: React.FC<{
  filter: FilterType;
  setFilter: React.Dispatch<React.SetStateAction<FilterType>>;
  user: User;
}> = ({ filter, setFilter, user }) => {
  const { projects, isProjectsLoading } = useProjects();

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
                setFilter(list);
              }}
              className={`link link-hover ${
                filter.type === list.type ? "font-bold" : ""
              } flex items-center justify-center @4xs/sidebar:justify-start gap-2 @max-4xs/sidebar:tooltip @max-4xs/sidebar:tooltip-right`}
              data-tip={list.name}
            >
              <span className="h-6 w-4 flex items-center justify-center">
                {list.icon}
              </span>
              <span className="whitespace-nowrap hidden @4xs/sidebar:inline">
                {list.name}
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
            <div key={project.id}>
              <div className="flex items-center justify-between gap-1 group">
                <a
                  className={`link link-hover flex items-center justify-start gap-2 flex-1 min-w-0  @max-4xs/sidebar:tooltip @max-4xs/sidebar:tooltip-right ${
                    filter.type === "project" &&
                    filter.project.id === project.id
                      ? "font-bold"
                      : ""
                  }`}
                  onClick={() => {
                    setFilter({
                      type: "project",
                      project: project,
                    });
                  }}
                  data-tip={project.name}
                >
                  <div className="block @4xs/sidebar:hidden mx-auto">
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
                    <div className="truncate flex-1 min-w-0">
                      {project.name}
                    </div>
                  </div>
                </a>
                <div className="hidden group-hover:block @max-4xs/sidebar:!hidden h-6 w-4 dropdown dropdown-end">
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
                    <ProjectDropdownMenu
                      project={project}
                      user={user}
                      filter={filter}
                      setFilter={setFilter}
                    />
                  </div>
                </div>
              </div>
              {project.author.id !== user.id ? (
                <div className="hidden @4xs:block text-xs text-content-light">
                  <AuthorName
                    ownerId={project.author.id}
                    ownerName={project.author.name}
                    userId={user.id}
                    shouldAddBy={true}
                  />
                </div>
              ) : (
                <></>
              )}
            </div>
          ))
        ) : isProjectsLoading ? (
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

const filterList: Array<
  Exclude<FilterType, { type: "project" }> & { icon: React.ReactNode }
> = [
  {
    type: "all",
    name: "All Notes",
    icon: <AllNotesIcon />,
  },
  {
    type: "public",
    name: "Public Notes",
    icon: <PublicNotesIcon />,
  },
  {
    type: "private",
    name: "Private Notes",
    icon: <PrivateNotesIcon />,
  },
  {
    type: "saved",
    name: "Saved Notes",
    icon: <SavedNotesIcon />,
  },
];

export default Sidebar;
