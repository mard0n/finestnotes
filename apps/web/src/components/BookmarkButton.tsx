import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { client } from "@utils/api";
import { parseResponse } from "hono/client";

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
        const res = await client.api.note[":id"]["bookmark-status"].$get({
          param: { id: noteId },
        });
        return await parseResponse(res);
      },
    }
  );
  const { isBookmarked } = bookmarkStatus || {};

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      const response = await client.api.note[":id"].bookmark.$post({
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
      const response = await client.api.note[":id"].bookmark.$delete({
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
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill={isBookmarked ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
        className="size-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
        ></path>
      </svg>
      <span className="hidden md:inline">Save</span>
    </button>
  );
};

export default BookmarkButtonWrapper;
