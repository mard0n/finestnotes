import CreateProjectModal from "./CreateProjectModal.tsx";
import AllNotesIcon from "@assets/all-notes-icon.svg?react";
import PublicNotesIcon from "@assets/globe.svg?react";
import PrivateNotesIcon from "@assets/lock.svg?react";
import SavedNotesIcon from "@assets/bookmark.svg";
import type { FilterType } from "./Notes.tsx";
import type { Projects } from "@utils/types.ts";
import type React from "react";

const Sidebar: React.FC<{
  filter: FilterType;
  setFilter: React.Dispatch<React.SetStateAction<FilterType>>;
  projects: Projects | undefined;
}> = ({ filter, setFilter, projects }) => {
  return (
    <>
      <div className="py-4 border-b border-neutral-300">
        <div className="h-10 is-drawer-open:ml-8 flex items-center font-serif font-bold text-xl whitespace-nowrap">
          <a href="/" className="is-drawer-close:hidden">
            Finest Notes
          </a>
          <a
            href="/"
            className="hidden is-drawer-close:block is-drawer-close:mx-auto"
          >
            FN
          </a>
        </div>
      </div>
      <div className="pt-6 mb-10 flex flex-col gap-3">
        {filterList.map((list) => {
          return (
            <a
              onClick={() => {
                setFilter({ type: list.type });
              }}
              className={`link link-hover ${
                filter.type === list.type ? "font-bold" : ""
              } is-drawer-open:ml-8 flex items-center gap-2 is-drawer-close:tooltip is-drawer-close:tooltip-right`}
              data-tip={list.text}
            >
              <span className="is-drawer-close:mx-auto">{list.icon}</span>
              <span className="whitespace-nowrap is-drawer-close:hidden">
                {list.text}
              </span>
            </a>
          );
        })}
      </div>

      <div className="mb-4 flex flex-col gap-3">
        <p className="is-drawer-open:ml-8 is-drawer-open:mr-6 flex justify-between items-center text-sm text-content-light">
          <span className="whitespace-nowrap is-drawer-close:hidden truncate">
            Projects
          </span>
          <CreateProjectModal />
        </p>
        {projects ? (
          projects.map((project) => (
            <a
              onClick={() => {
                setFilter({ type: "project", id: project.id });
              }}
              className={`is-drawer-open:ml-8 is-drawer-open:mr-6 link link-hover flex items-center gap-2 is-drawer-close:tooltip is-drawer-close:tooltip-right ${
                filter.type === "project" && filter.id === project.id
                  ? "font-bold"
                  : ""
              }`}
              data-tip={project.name}
            >
              <span className="hidden is-drawer-close:inline is-drawer-close:mx-auto">
                {project.name.charAt(0).toUpperCase()}
              </span>
              <span className="is-drawer-close:hidden">
                {project.isPublic ? <PublicNotesIcon /> : <PrivateNotesIcon />}
              </span>

              <span className="whitespace-nowrap is-drawer-close:hidden truncate">
                {project.name}
              </span>
            </a>
          ))
        ) : (
          <div className="is-drawer-open:ml-8">Loading projects...</div>
        )}
      </div>
    </>
  );
};

const filterList = [
  {
    type: "all" as const,
    text: "All Notes",
    icon: <AllNotesIcon />,
  },
  {
    type: "public" as const,
    text: "Public Notes",
    icon: <PublicNotesIcon />,
  },
  {
    type: "private" as const,
    text: "Private Notes",
    icon: <PrivateNotesIcon />,
  },
];

export default Sidebar;
