import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { client } from "@utils/api";
import { parseResponse } from "hono/client";
import TrashIcon from "@assets/trash.svg?react";

const NoteDeleteButtonWrapper: React.FC<{
  noteId: string;
  noteTitle: string;
  onSuccess?: () => void;
  queryClient?: QueryClient;
}> = ({ noteId, noteTitle, onSuccess, queryClient }) => {
  const queryClientInstance = queryClient || new QueryClient();
  return (
    <QueryClientProvider client={queryClientInstance}>
      <NoteDeleteButton
        noteId={noteId}
        noteTitle={noteTitle}
        onSuccess={onSuccess}
      />
    </QueryClientProvider>
  );
};

const NoteDeleteButton: React.FC<{
  noteId: string;
  noteTitle: string;
  onSuccess?: () => void;
}> = ({ noteId, noteTitle, onSuccess }) => {
  const queryClient = useQueryClient();

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.notes[":id"].$delete({
        param: { id: id },
      });
      return await parseResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      onSuccess?.();
    },
  });

  const handleDeleteClick = () => {
    if (
      window.confirm(
        `Are you sure you want to delete "${noteTitle || "Untitled note"}"?`
      )
    ) {
      deleteNote.mutate(noteId);
    }
  };

  return (
    <button
      className="btn btn-error btn-sm rounded-full bg-white text-red-500 font-normal truncate"
      onClick={handleDeleteClick}
      disabled={deleteNote.isPending}
    >
      <TrashIcon />
      <span className="hidden xs:inline">Delete</span>
    </button>
  );
};

export default NoteDeleteButtonWrapper;
