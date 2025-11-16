import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { client } from "@utils/api";
import { parseResponse } from "hono/client";
import BookmarkIcon from "@assets/bookmark.svg?react";

const BookmarkButtonWrapper: React.FC<{
  noteId: string;
  authorId: string;
  userId: string | null | undefined;
  onSuccess?: () => void;
  queryClient?: QueryClient;
}> = ({ noteId, authorId, userId, onSuccess, queryClient }) => {
  const queryClientInstance = queryClient || new QueryClient();
  return (
    <QueryClientProvider client={queryClientInstance}>
      <BookmarkButton
        noteId={noteId}
        authorId={authorId}
        userId={userId}
        onSuccess={onSuccess}
      />
    </QueryClientProvider>
  );
};

const BookmarkButton: React.FC<{
  noteId: string;
  authorId: string;
  userId: string | null | undefined;
  onSuccess?: () => void;
}> = ({ noteId, authorId, userId, onSuccess }) => {
  const queryClient = useQueryClient();

  const { data: bookmarkStatus, isLoading: isBookmarkStatusLoading } = useQuery(
    {
      queryKey: ["note-bookmark-status", noteId],
      queryFn: async () => {
        const res = await client.api.notes[":id"]["bookmark-status"].$get({
          param: { id: noteId },
        });
        return await parseResponse(res);
      },
    }
  );
  const { isBookmarked } = bookmarkStatus || {};

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      const response = await client.api.notes[":id"].bookmark.$post({
        param: { id: noteId },
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["note-bookmark-status", noteId],
      });
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Error bookmarking article:", error);
    },
  });

  const unbookmarkMutation = useMutation({
    mutationFn: async () => {
      const response = await client.api.notes[":id"].bookmark.$delete({
        param: { id: noteId },
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["note-bookmark-status", noteId],
      });
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Error unbookmarking article:", error);
    },
  });

  const handleBookmarkClick = () => {
    if (!userId) {
      window.location.href = "/auth/login";
      return;
    }

    if (isBookmarked) {
      unbookmarkMutation.mutate();
    } else {
      bookmarkMutation.mutate();
    }
  };

  if (!userId || userId === authorId) {
    return null;
  }

  return (
    <button
      className={`btn btn-ghost btn-sm rounded-full bg-white font-normal ${
        isBookmarked ? "text-black" : ""
      }`}
      onClick={handleBookmarkClick}
      disabled={bookmarkMutation.isPending || unbookmarkMutation.isPending}
    >
      <BookmarkIcon fill={isBookmarked ? "currentColor" : "none"} />
      <span className="hidden md:inline">Save</span>
    </button>
  );
};

export default BookmarkButtonWrapper;
