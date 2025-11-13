import React, { useState, useEffect } from "react";
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

const $comments = client.api.comments.article[":noteId"].$get;
export type CommentsResponse = InferResponseType<typeof $comments, 200>;
export type Comment = CommentsResponse["comments"][0];

interface CommentSectionProps {
  noteId: string;
  currentUser: { id: string; name: string } | null | undefined;
  isOpen?: boolean;
}

const queryClient = new QueryClient();

const CommentSectionWrapper: React.FC<CommentSectionProps> = (props) => {
  return (
    <QueryClientProvider client={queryClient}>
      <CommentSection {...props} />
    </QueryClientProvider>
  );
};

const CommentSection: React.FC<CommentSectionProps> = ({
  noteId,
  currentUser,
  isOpen = true,
}) => {
  const [content, setContent] = useState("");

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
      queryClient.invalidateQueries({ queryKey: ["comments", noteId] });
    },
  });

  const comments = commentsData?.comments || [];
  const totalCount = commentsData?.total || 0;

  const handleCommentSubmit = async (content: string) => {
    if (!content.trim()) {
      return;
    }

    if (!currentUser) {
      return;
    }

    createCommentMutation.mutate({
      noteId,
      content: content.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-0.5 bg-content-light/20 mt-10 mb-6"></div>
          <div className="h-20 bg-content-light/20 rounded"></div>
          <div className="h-4 bg-content-light/20 rounded w-1/4"></div>
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
    <div className="collapse collapse-arrow px-0">
      <input id="comments-collapse" type="checkbox" defaultChecked={isOpen} />
      <div className="collapse-title font-semibold px-0">Comments ({totalCount})</div>
      <div className="collapse-content text-sm px-0">
        {createCommentMutation.isError && (
          <div className="alert alert-error alert-soft border border-red-400 text-sm">
            Failed to post comment. Please try again.
          </div>
        )}

        {currentUser ? (
          <CommentInput
            placeholder={"Write a comment..."}
            content={content}
            setContent={setContent}
            onSubmit={handleCommentSubmit}
            onCancel={() => {}}
            isPending={createCommentMutation.isPending}
          />
        ) : (
          <div className="p-4 bg-base-200 border border-neutral-300 text-center">
            <p className="text-sm text-content-medium">
              Please{" "}
              <a href="/auth/login" className="link">
                login
              </a>{" "}
              to leave a comment
            </p>
          </div>
        )}

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
            <div className="text-center py-8 text-content-medium">
              No comments yet. Be the first to comment!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface CommentInputProps {
  placeholder: string;
  content: string;
  setContent: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: (content: string) => void;
  onCancel: () => void;
  isPending: boolean;
  autoFocus?: boolean;
}

const CommentInput: React.FC<CommentInputProps> = ({
  placeholder,
  content,
  setContent,
  onSubmit,
  onCancel,
  isPending,
  autoFocus = false,
}) => {
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [onCancel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      return;
    }

    onSubmit(content.trim());
    setContent("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        id="comment-content"
        name="comment-content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="textarea w-full"
        rows={3}
        disabled={isPending}
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
              disabled={isPending}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isPending || !content.trim()}
            className="btn btn-xs btn-primary"
          >
            {isPending ? "Posting..." : "Submit"}
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
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isAuthor = currentUser?.id === comment.author.id;

  const [isCollapsed, setIsCollapsed] = useState(false);

  const queryClient = useQueryClient();
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

  const createReplyMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ["comments", noteId] });

      setReplyContent("");
      setIsReplying(false);
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

  const handleReply = async () => {
    if (!replyContent.trim()) {
      return;
    }

    createReplyMutation.mutate({
      noteId,
      content: replyContent.trim(),
      parentCommentId: comment.id,
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
    <div className={`${depth % 2 === 0 ? "bg-base-200" : "bg-black/3"}`}>
      <div className="flex flex-col gap-4 border border-neutral-300 rounded-none px-4 py-3">
        <div className="flex items-center gap-4 text-sm text-content-medium">
          <span className="flex items-center gap-1">
            {isCollapsed ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="size-4 cursor-pointer"
                onClick={() => {
                  setIsCollapsed(false);
                }}
              >
                <path
                  fillRule="evenodd"
                  d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="size-4 cursor-pointer"
                onClick={() => {
                  setIsCollapsed(true);
                }}
              >
                <path
                  fillRule="evenodd"
                  d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <AuthorName
              ownerId={comment.author.id}
              ownerName={comment.author.name}
              userId={currentUser?.id}
            />
          </span>
          <span className="text-content-light">
            {formatDate(comment.createdAt)}
          </span>
          <span className="flex items-center gap-2 text-content-light">
            <button
              onClick={() => handleReact("like")}
              disabled={!currentUser}
              className="disabled:opacity-50 disabled:cursor-not-allowed hover:text-black"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={comment.userReaction === "like" ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className=""
              >
                <path d="M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
              </svg>
            </button>

            <span className="text-content-medium">
              {comment.likeCount - comment.dislikeCount}
            </span>

            <button
              onClick={() => handleReact("dislike")}
              disabled={!currentUser}
              className="disabled:opacity-50 disabled:cursor-not-allowed hover:text-black"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={
                  comment.userReaction === "dislike" ? "currentColor" : "none"
                }
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="rotate-180"
              >
                <path d="M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
              </svg>
            </button>
          </span>
          {isAuthor ? (
            <span className="ml-auto dropdown dropdown-end">
              <span tabIndex={0} role="link" className="">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="size-4"
                >
                  <path d="M8 2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM8 6.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM9.5 12.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
                </svg>
              </span>
              <div className="dropdown-content menu z-1 w-52 p-2">
                <ul className="bg-base-100 p-2 shadow-sm" tabIndex={-1}>
                  <li
                    onClick={() => {
                      setIsEditing(true);
                      setIsReplying(false);
                    }}
                  >
                    <a>Edit</a>
                  </li>
                  <li onClick={handleDelete} className="text-red-600">
                    <a>Delete</a>
                  </li>
                </ul>
              </div>
            </span>
          ) : null}
        </div>

        {isEditing ? (
          <CommentInput
            content={editContent}
            setContent={setEditContent}
            placeholder="Write a comment..."
            onCancel={() => setIsEditing(false)}
            autoFocus={true}
            isPending={updateCommentMutation.isPending}
            onSubmit={(content) => {
              setEditContent(content);
              handleEdit();
            }}
          />
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-content-light">
          {currentUser && (
            <button
              onClick={() => {
                setIsReplying(!isReplying);
                setIsEditing(false);
              }}
              className="link link-hover"
            >
              Reply
            </button>
          )}
        </div>

        {isReplying && (
          <div className="ml-8 mt-4">
            <CommentInput
              placeholder="Write a reply..."
              content={replyContent}
              setContent={setReplyContent}
              isPending={createReplyMutation.isPending}
              onCancel={() => setIsReplying(false)}
              onSubmit={handleReply}
              autoFocus={true}
            />
          </div>
        )}

        {comment.replies?.map((reply) => (
          <CommentComponent
            key={reply.id}
            comment={reply}
            noteId={noteId}
            currentUser={currentUser}
            depth={depth + 1}
          />
        ))}
      </div>
    </div>
  );
};

export default CommentSectionWrapper;
