import React, { useRef } from "react";
import { type Collections } from "./Notes";
import { $getRoot, type LexicalEditor } from "lexical";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import TreeViewPlugin from "../lexical/plugins/TreeViewPlugin";

import { TRANSFORMERS } from "@lexical/markdown";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { HashtagNode } from "@lexical/hashtag";

import { client } from "@utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { theme } from "../styles/lexical-theme";

interface NoteEditorProps {
  note: Collections[number] & { type: "note" };
}

function onError(error: Error, editor: LexicalEditor) {
  console.error(error);
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note }) => {
  const queryClient = useQueryClient();

  const updateNoteContent = useMutation({
    mutationFn: async ({
      id,
      content,
      contentLexical,
    }: {
      id: string;
      content: string;
      contentLexical: string;
    }) => {
      const res = await client.api.note[":id"].content.$put({
        param: { id },
        json: { content, contentLexical },
      });
      return await parseResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });

  const contentEditableRef = useRef<HTMLDivElement>(null);

  const getInitialEditorState = () => {
    if (!note.contentLexical || note.contentLexical.trim() === "") {
      return undefined;
    }

    try {
      const parsed = JSON.parse(note.contentLexical);
      if (!parsed.root.children || parsed.root.children.length === 0) {
        return undefined;
      }
      return note.contentLexical;
    } catch (e) {
      console.error("Failed to parse editor content:", e);
      return undefined;
    }
  };

  const initialConfig = {
    namespace: "MyEditor",
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      LinkNode,
      AutoLinkNode,
      HashtagNode,
    ],
    theme,
    onError,
    editorState: getInitialEditorState(),
  };

  return (
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
          editorState.read(() => {
            // You can read the editor state here if needed
            const root = $getRoot();

            updateNoteContent.mutate({
              id: note.id,
              content: root.getTextContent(),
              contentLexical: JSON.stringify(editorStateJSON),
            });
          });
        }}
      />
      <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
      {/* <TreeViewPlugin /> */}
    </LexicalComposer>
  );
};

export default NoteEditor;
