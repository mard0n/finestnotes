import React, { useState } from "react";
import type { Collections } from "./Notes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@utils/api";
import { parseResponse } from "hono/client";

type AnnotationType = Collections[number] & { type: "page" };

interface AnnotationEditorProps {
  annotation: AnnotationType;
}

const AnnotationEditor: React.FC<AnnotationEditorProps> = ({ annotation }) => {
  const queryClient = useQueryClient();

  const updateAnnotationTitle = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const res = await client.api.page[":id"].title.$put({
        param: { id: id.toString() },
        json: { title },
      });
      return await parseResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });

  const updateAnnotationDescription = useMutation({
    mutationFn: async ({
      id,
      description,
    }: {
      id: string;
      description: string;
    }) => {
      const res = await client.api.page[":id"].description.$put({
        param: { id: id.toString() },
        json: { description },
      });
      return await parseResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });

  return (
    <div className="flex flex-col h-full w-full">
      <h1
        contentEditable
        className="text-2xl font-serif outline-none text-black mb-2"
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            // blur the element to prevent new lines
            (e.target as HTMLElement).blur();
          }
        }}
        onBlur={(e) => {
          updateAnnotationTitle.mutate({
            id: annotation.id,
            title: e.target.textContent || "Untitled",
          });
        }}
        suppressContentEditableWarning
      >
        {annotation.title}
      </h1>
      <p
        contentEditable
        className="mb-6 outline-none"
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            // blur the element to prevent new lines
            (e.target as HTMLElement).blur();
          }
        }}
        onBlur={(e) => {
          updateAnnotationDescription.mutate({
            id: annotation.id,
            description: e.target.textContent || "No description",
          });
        }}
        suppressContentEditableWarning
      >
        {annotation.description}
      </p>

      {annotation.content ? (
        <div className="flex flex-col gap-4 overflow-y-auto">
          {annotation.content.map((content) => {
            if (content.type === "highlight") {
              return (
                <HighlightComponent key={content.id} highlight={content} />
              );
            } else if (content.type === "image") {
              return <ImageComponent key={content.id} image={content} />;
            } else {
              return null;
            }
          })}
        </div>
      ) : (
        <p className="pointer-events-none text-gray-content">
          No highlights. No annotations
        </p>
      )}
    </div>
  );
};

type HighlightContentType = AnnotationType["content"][number] & {
  type: "highlight";
};

const HighlightComponent: React.FC<{
  highlight: HighlightContentType;
}> = ({ highlight }) => {
  const queryClient = useQueryClient();

  const updateHighlightComment = useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment: string }) => {
      const res = await client.api.highlight[":id"].comment.$put({
        param: { id: id.toString() },
        json: { comment },
      });
      return await parseResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });

  return (
    <div>
      <blockquote className="text-md pl-5 text-gray-dark/90 italic relative before:content-[''] before:absolute before:left-0 before:top-0 before:w-0.5 before:h-full before:bg-gray-light">
        {highlight.text}
      </blockquote>
      <div className="pl-5 pt-2 flex">
        <CommentComponent
          comment={highlight.comment}
          onCommentChange={(newComment) => {
            updateHighlightComment.mutate({
              id: highlight.id,
              comment: newComment,
            });
          }}
        />
      </div>
    </div>
  );
};

type ImageContentType = AnnotationType["content"][number] & {
  type: "image";
};

const ImageComponent: React.FC<{
  image: ImageContentType;
}> = ({ image }) => {
  return (
    <div className="image-annotation">
      <img src={image.imageUrl} alt={image.caption || ""} />
    </div>
  );
};

const CommentComponent: React.FC<{
  comment: string | null;
  onCommentChange: (newComment: string) => void;
}> = ({ comment, onCommentChange }) => {
  const [isCommenting, setIsCommenting] = useState(false);
  const [newComment, setNewComment] = useState(comment || "");

  console.log("newComment", newComment);

  return isCommenting ? (
    <div className="mr-4 w-full">
      <textarea
        name="comment"
        placeholder="Add your comment..."
        className="textarea textarea-neutral w-full"
        value={newComment}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.shiftKey) {
            e.preventDefault();
            onCommentChange(newComment);
            setIsCommenting(false);
            return;
          }

          if (e.key === "Escape") {
            setIsCommenting(false);
            return;
          }
        }}
        onChange={(e) => setNewComment(e.target.value)}
      />
      <div className="flex justify-end pt-2">
        <button
          className="btn btn-xs btn-ghost"
          onClick={() => {
            setNewComment(comment || "");
            setIsCommenting(false);
          }}
        >
          Cancel
        </button>
        <button
          className="btn btn-xs btn-ghost btn-primary"
          onClick={() => {
            onCommentChange(newComment);
            setIsCommenting(false);
          }}
        >
          Submit
        </button>
      </div>
    </div>
  ) : comment ? (
    <div className="mr-4 w-full flex items-center gap-2">
      <svg
        width="18"
        height="24"
        viewBox="0 0 18 24"
        fill="none"
        strokeWidth={1.5}
        stroke="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className="text-gray-light"
      >
        <path
          d="M5.59331 2.21094C5.56389 2.90311 5.57153 4.31055 5.66732 6.20438C5.74104 7.66184 6.15775 8.74089 6.57635 9.72788C7.05127 10.8476 7.99939 11.9176 9.20746 13.0572C11.9235 14.9973 12.7838 15.268 13.7264 15.4066C14.3353 15.4673 15.2096 15.5083 16.3297 15.3949"
          strokeLinecap="round"
        />
        <path
          d="M5.75 0.75C5.46772 1.07097 4.78266 1.90464 3.80194 2.86101C2.96217 3.5316 2.21102 4.05256 1.65496 4.3499C1.36793 4.49276 1.07102 4.6193 0.75 4.75"
          strokeLinecap="round"
        />
        <path
          d="M5.75 0.75C5.94087 1.31411 6.70123 2.44873 7.50638 3.20266C7.95967 3.52297 8.71853 3.94073 9.60442 4.36008C9.98393 4.53067 10.2212 4.61555 10.75 4.75"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-md mt-2">{comment}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-5 text-gray-light hover:text-black cursor-pointer mt-1"
        onClick={() => setIsCommenting(true)}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
        />
      </svg>
    </div>
  ) : (
    <div
      className="flex items-center gap-2 cursor-pointer "
      onClick={() => setIsCommenting(true)}
    >
      <svg
        width="18"
        height="24"
        viewBox="0 0 18 24"
        fill="none"
        strokeWidth={1.5}
        stroke="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className="text-gray-light"
      >
        <path
          d="M5.59331 2.21094C5.56389 2.90311 5.57153 4.31055 5.66732 6.20438C5.74104 7.66184 6.15775 8.74089 6.57635 9.72788C7.05127 10.8476 7.99939 11.9176 9.20746 13.0572C11.9235 14.9973 12.7838 15.268 13.7264 15.4066C14.3353 15.4673 15.2096 15.5083 16.3297 15.3949"
          strokeLinecap="round"
        />
        <path
          d="M5.75 0.75C5.46772 1.07097 4.78266 1.90464 3.80194 2.86101C2.96217 3.5316 2.21102 4.05256 1.65496 4.3499C1.36793 4.49276 1.07102 4.6193 0.75 4.75"
          strokeLinecap="round"
        />
        <path
          d="M5.75 0.75C5.94087 1.31411 6.70123 2.44873 7.50638 3.20266C7.95967 3.52297 8.71853 3.94073 9.60442 4.36008C9.98393 4.53067 10.2212 4.61555 10.75 4.75"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-sm mt-2 text-gray-light hover:text-black">
        Add a comment
      </span>
    </div>
  );
};

export default AnnotationEditor;
