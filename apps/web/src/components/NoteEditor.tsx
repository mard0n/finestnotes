import React, { useRef, useState, useEffect, useCallback } from "react";
import { type Collections } from "./Notes";
import { $getRoot, $getSelection, type LexicalEditor } from "lexical";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import TreeViewPlugin from "../lexical/plugins/TreeViewPlugin";
import { client } from "@utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseResponse } from "hono/client";

interface NoteEditorProps {
  note: Collections[number] & { type: "note" };
}

const theme = {
  // Theme styling goes here
  //...
};

function onError(error: Error, editor: LexicalEditor) {
  console.error(error);
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ note }) => {
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

  const updateNoteContent = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const res = await client.api.note[":id"].content.$put({
        param: { id: id.toString() },
        json: { content },
      });
      return await parseResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });

  const contentEditableRef = useRef<HTMLDivElement>(null);

  const handleNoteTitleEdit = (newTitle: string) => {
    updateNoteTitle.mutate({ id: note.id, title: newTitle });
  };

  const getInitialEditorState = () => {
    if (!note.content || note.content.trim() === "") {
      return undefined;
    }

    try {
      const parsed = JSON.parse(note.content);
      if (!parsed.root.children || parsed.root.children.length === 0) {
        return undefined;
      }
      return note.content;
    } catch (e) {
      console.error("Failed to parse editor content:", e);
      return undefined;
    }
  };

  const initialConfig = {
    namespace: "MyEditor",
    theme,
    onError,
    editorState: getInitialEditorState(),
  };

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
            contentEditableRef.current?.focus();
          }
        }}
        onBlur={(e) => {
          handleNoteTitleEdit(e.target.textContent || "Untitled");
        }}
        suppressContentEditableWarning
      >
        {note.title}
      </h1>
      <LexicalComposer initialConfig={initialConfig}>
        <div className="relative grow">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="h-full outline-none text-sm"
                ref={contentEditableRef}
                aria-placeholder={"What's on your mind?"}
                placeholder={
                  <div className="absolute left-0 top-0 pointer-events-none text-gray-content">
                    Take a note...
                  </div>
                }
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <OnChangePlugin
          onChange={(editorState) => {
            const editorStateJSON = editorState.toJSON();
            updateNoteContent.mutate({
              id: note.id,
              content: JSON.stringify(editorStateJSON),
            });
          }}
        />
        {/* <TreeViewPlugin /> */}
      </LexicalComposer>
    </div>
  );
};

export default NoteEditor;
