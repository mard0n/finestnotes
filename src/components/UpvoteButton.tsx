import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { client } from "@utils/api";
import { parseResponse } from "hono/client";

const UpvoteButtonWrapper: React.FC<{
  noteId: string;
  userId: string | null | undefined;
  onSuccess?: () => void;
  queryClient?: QueryClient;
}> = ({ noteId, userId, onSuccess, queryClient }) => {
  const queryClientInstance = queryClient || new QueryClient();
  return (
    <QueryClientProvider client={queryClientInstance}>
      <UpvoteButton noteId={noteId} userId={userId} onSuccess={onSuccess} />
    </QueryClientProvider>
  );
};

const UpvoteButton: React.FC<{
  noteId: string;
  userId: string | null | undefined;
  onSuccess?: () => void;
}> = ({ noteId, userId, onSuccess }) => {
  const queryClient = useQueryClient();

  const { data: likeStatus, isLoading: isLikeStatusLoading } = useQuery({
    queryKey: ["note-like-status", noteId],
    queryFn: async () => {
      const res = await client.api.notes[":id"]["like-status"].$get({
        param: { id: noteId },
      });
      return await parseResponse(res);
    },
  });
  const { isLiked, likeCount } = likeStatus || {};

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await client.api.notes[":id"].like.$post({
        param: { id: noteId },
      });
      return await parseResponse(res);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["note-like-status", noteId] });
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Error liking article:", error);
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async () => {
      const res = await client.api.notes[":id"].like.$delete({
        param: { id: noteId },
      });
      return await parseResponse(res);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["note-like-status", noteId] });
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Error unliking article:", error);
    },
  });

  const handleLikeClick = () => {
    if (!userId) {
      window.location.href = "/auth/login";
      return;
    }

    if (isLiked) {
      unlikeMutation.mutate();
    } else {
      likeMutation.mutate();
    }
  };

  return (
    <button
      className={`btn btn-ghost btn-sm rounded-full font-normal bg-white ${
        isLiked ? "text-black" : ""
      }`}
      onClick={handleLikeClick}
      disabled={likeMutation.isPending || unlikeMutation.isPending}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={isLiked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className=""
      >
        <path d="M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
      </svg>
      {isLikeStatusLoading ? "..." : likeCount}
    </button>
  );
};

export default UpvoteButtonWrapper;
