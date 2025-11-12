import React, { useState } from "react";
import { client } from "@utils/api";
import { formatDate } from "@utils/date";
import AuthorName from "./AuthorName";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { parseResponse, type InferResponseType } from "hono/client";
import type { User } from "@utils/types";

const queryClient = new QueryClient();

const CommentSectionWrapper: React.FC<CommentSectionProps> = (props) => {
  return (
    <QueryClientProvider client={queryClient}>
      <CommentSection {...props} />
    </QueryClientProvider>
  );
};

// Comment types
const $comments = client.api.comments.article[":noteId"].$get;
export type CommentsResponse = InferResponseType<typeof $comments, 200>;
export type Comment = CommentsResponse["comments"][0];

interface CommentSectionProps {
  noteId: string;
  currentUser?: { id: string; name: string } | null;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  noteId,
  currentUser,
}) => {
  const {
    data: commentsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["comments", noteId],
    queryFn: async () => {
      const response = await client.api.comments.article[":noteId"].$get({
        param: { noteId },
      });
      return await parseResponse(response);
    },
  });

  const comments = commentsData?.comments || [];
  const totalCount = commentsData?.total || 0;

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          Failed to load comments
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="divider mt-10 mb-6">
        {totalCount} {totalCount === 1 ? "comment" : "comments"}
      </div>

      <CommentInput noteId={noteId} currentUser={currentUser} />

      <div className="mt-8 space-y-6">
        {comments.map((comment) => (
          <CommentComponent
            key={comment.id}
            comment={comment}
            noteId={noteId}
            currentUser={currentUser}
          />
        ))}

        {comments.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>
    </div>
  );
};

interface CommentInputProps {
  noteId: string;
  currentUser?: { id: string; name: string } | null;
  parentCommentId?: string;
  onCancel?: () => void;
  autoFocus?: boolean;
}

const CommentInput: React.FC<CommentInputProps> = ({
  noteId,
  currentUser,
  parentCommentId,
  onCancel,
  autoFocus = false,
}) => {
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();

  const createCommentMutation = useMutation({
    mutationFn: async (data: {
      noteId: string;
      content: string;
      parentCommentId?: string;
    }) => {
      const response = await client.api.comments.$post({
        json: data,
      });
      return await parseResponse(response);
    },
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["comments", noteId] });
      if (onCancel) {
        onCancel();
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      return;
    }

    if (!currentUser) {
      return;
    }

    createCommentMutation.mutate({
      noteId,
      content: content.trim(),
      ...(parentCommentId && { parentCommentId }),
    });
  };

  if (!currentUser) {
    return (
      <div className="p-4 bg-gray-50 border border-neutral-300 text-center">
        <p className="text-sm text-content-dark">
          Please{" "}
          <a href="/auth/login" className="link">
            sign in
          </a>{" "}
          to leave a comment
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {createCommentMutation.isError && (
        <div className="alert alert-error alert-soft border border-red-400 text-sm">
          Failed to post comment. Please try again.
        </div>
      )}

      <textarea
        id="comment-content"
        name="comment-content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          parentCommentId ? "Write a reply..." : "Write a comment..."
        }
        className="textarea w-full"
        rows={3}
        disabled={createCommentMutation.isPending}
        autoFocus={autoFocus}
        maxLength={5000}
      />

      <div className="flex justify-between items-center">
        <span className="text-xs text-content-light">
          {content.length}/5000 characters
        </span>
        <div className="flex justify-end gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-xs"
              disabled={createCommentMutation.isPending}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={createCommentMutation.isPending || !content.trim()}
            className="btn btn-xs btn-primary"
          >
            {createCommentMutation.isPending
              ? "Posting..."
              : parentCommentId
              ? "Reply"
              : "Comment"}
          </button>
        </div>
      </div>
    </form>
  );
};

interface CommentComponentProps {
  comment: Comment;
  noteId: string;
  currentUser?: { id: string; name: string } | null;
  depth?: number;
}

const CommentComponent: React.FC<CommentComponentProps> = ({
  comment,
  noteId,
  currentUser,
  depth = 0,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const queryClient = useQueryClient();
  const isAuthor = currentUser?.id === comment.author.id;

  const updateCommentMutation = useMutation({
    mutationFn: async (data: { id: string; content: string }) => {
      const response = await client.api.comments[":id"].$patch({
        param: { id: data.id },
        json: { content: data.content },
      });
      return await parseResponse(response);
    },
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["comments", noteId] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await client.api.comments[":id"].$delete({
        param: { id },
      });
      return await parseResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", noteId] });
    },
  });

  const reactToCommentMutation = useMutation({
    mutationFn: async (data: { id: string; type: "like" | "dislike" }) => {
      const response = await client.api.comments[":id"].react.$post({
        param: { id: data.id },
        json: { type: data.type },
      });
      return await parseResponse(response);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["comments", noteId] });
    },
  });

  const handleEdit = async () => {
    if (!editContent.trim()) {
      return;
    }

    updateCommentMutation.mutate({
      id: comment.id,
      content: editContent.trim(),
    });
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    deleteCommentMutation.mutate(comment.id);
  };

  const handleReact = async (type: "like" | "dislike") => {
    if (!currentUser) {
      alert("Please sign in to react to comments");
      return;
    }

    reactToCommentMutation.mutate({ id: comment.id, type });
  };

  return (
    <div className={`${depth > 0 ? "ml-8 mt-4" : ""}`}>
      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <AuthorName
              ownerId={comment.author.id}
              ownerName={comment.author.name}
              userId={currentUser?.id}
            />
            <span className="text-xs text-gray-500">
              {formatDate(comment.createdAt)}
            </span>
          </div>

          {isEditing ? (
            <div className="space-y-2">
              {updateCommentMutation.isError && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
                  Failed to update comment
                </div>
              )}
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                rows={3}
                disabled={updateCommentMutation.isPending}
                maxLength={5000}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  disabled={updateCommentMutation.isPending}
                  className="px-3 py-1 bg-black text-white text-xs rounded hover:bg-gray-800 disabled:bg-gray-300"
                >
                  {updateCommentMutation.isPending ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  disabled={updateCommentMutation.isPending}
                  className="px-3 py-1 text-gray-700 text-xs hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-800 mb-2 whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => handleReact("like")}
              disabled={!currentUser}
              className={`flex items-center gap-1 ${
                comment.userReaction === "like"
                  ? "text-blue-600 font-medium"
                  : "text-gray-600 hover:text-blue-600"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span>👍</span>
              <span>{comment.likeCount}</span>
            </button>

            <button
              onClick={() => handleReact("dislike")}
              disabled={!currentUser}
              className={`flex items-center gap-1 ${
                comment.userReaction === "dislike"
                  ? "text-red-600 font-medium"
                  : "text-gray-600 hover:text-red-600"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span>👎</span>
              <span>{comment.dislikeCount}</span>
            </button>

            {currentUser && (
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="text-gray-600 hover:text-black"
              >
                Reply
              </button>
            )}

            {isAuthor && !isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-gray-600 hover:text-black"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              </>
            )}
          </div>

          {isReplying && (
            <div className="mt-3">
              <CommentInput
                noteId={noteId}
                currentUser={currentUser}
                parentCommentId={comment.id}
                onCancel={() => setIsReplying(false)}
                autoFocus={true}
              />
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4">
              {comment.replies.map((reply) => (
                <CommentComponent
                  key={reply.id}
                  comment={reply}
                  noteId={noteId}
                  currentUser={currentUser}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentSectionWrapper;
