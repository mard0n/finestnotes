import { useEffect } from "react";
import type { FilterType } from "../Notes";
import { useNotes } from "./useNotes";
import { useProjects } from "./useProjects";

/**
 * Hook to fetch notes/projects and handle URL parameters
 * Checks for noteId or projectId in URL params and updates filter/selection accordingly
 */
export const useUrlParamsToSetSelection = ({
  filter,
  setFilter,
  setSelectedNoteId,
}: {
  filter: FilterType;
  setFilter: React.Dispatch<React.SetStateAction<FilterType>>;
  setSelectedNoteId: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  const { notes } = useNotes({ filter });
  const { projects } = useProjects();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const noteId = urlParams.get("noteId");
    const projectId = urlParams.get("projectId");

    if (noteId) {
      const noteExists = notes?.some((note) => note.id === noteId);
      if (!noteExists) return;
      setFilter({ type: "all", name: "All Notes" });
      setSelectedNoteId(noteId);
      window.history.replaceState({}, "", "/notes");
    } else if (projectId) {
      const foundProject = projects?.find(
        (project) => project.id === projectId
      );
      if (!foundProject) return;
      setFilter({ type: "project", project: foundProject });
      window.history.replaceState({}, "", "/notes");
    }
  }, [notes, projects, setFilter, setSelectedNoteId]);

  return null;
};
