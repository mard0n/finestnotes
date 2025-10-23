import React, { useState } from "react";
import type { Collections } from "./Notes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@utils/api";
import { parseResponse } from "hono/client";

interface AnnotationEditorProps {
  annotation: Collections[number] & { type: "page" };
}

export const AnnotationEditor: React.FC<AnnotationEditorProps> = ({
  annotation,
}) => {
  const queryClient = useQueryClient();

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

  return (
    <div className="flex flex-col h-full w-full gap-4">
      <h1
        contentEditable
        className="text-2xl font-serif outline-none"
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
          updateNoteTitle.mutate({
            id: annotation.id,
            title: e.target.textContent || "Untitled",
          });
        }}
        suppressContentEditableWarning
      >
        {annotation.title}
      </h1>
      {annotation.content ? (
        <div className="text-sm flex flex-col gap-4 overflow-y-auto">
          {annotation.content &&
            annotation.content.map((content, index) => {
              if (content.type === "highlight") {
                return (
                  <blockquote key={index} className="alert alert-soft">
                    {content.text}
                  </blockquote>
                );
              } else if (content.type === "image") {
                return (
                  <div key={index} className="image-annotation">
                    <img src={content.imageUrl} alt={content.caption || ""} />
                  </div>
                );
              } else {
                return null;
              }
            })}
        </div>
      ) : (
        <p>No content</p>
      )}
    </div>
  );
};
