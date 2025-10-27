import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { client } from "@utils/api";
import { parseResponse } from "hono/client";
import { AddToProjectDropdownContent } from "../components/ProjectModals";
import AnnotationViewer from "../editors-viewers/AnnotationViewer";
import NoteViewer from "../editors-viewers/NoteViewer";
import type { User } from "better-auth";
import AnnotationEditor from "../editors-viewers/AnnotationEditor";
import NoteEditor from "../editors-viewers/NoteEditor";

const SelectedNoteEditor: React.FC<{
  selectedNoteId: string | null;
  user: User;
}> = ({ selectedNoteId, user }) => {
  const queryClient = useQueryClient();

  const { data: selectedNote } = useQuery({
    queryKey: ["collection", selectedNoteId],
    queryFn: async () => {
      const res = await client.api.collections[":id"].$get({
        param: { id: selectedNoteId! },
      });
      return await parseResponse(res);
    },
    enabled: !!selectedNoteId,
  });

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

  if (!selectedNote) {
    return (
      <div className="flex justify-center items-center h-full">
        <span className="text-gray-light select-none">No note selected</span>
      </div>
    );
  }

  if (selectedNote?.userId !== user.id) {
    return (
      <>
        <h1 className="text-2xl font-serif outline-none text-black mb-2 grow">
          {selectedNote.title}
        </h1>
        {selectedNote.type === "page" ? (
          <AnnotationViewer annotation={selectedNote} />
        ) : (
          <NoteViewer note={selectedNote} />
        )}
      </>
    );
  }

  return (
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
          autoFocus
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
  );
};

export default SelectedNoteEditor;
