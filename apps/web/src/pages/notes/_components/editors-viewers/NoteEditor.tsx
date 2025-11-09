import React, { useRef } from "react";
import { $getRoot } from "lexical";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";

import { TRANSFORMERS } from "@lexical/markdown";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { HashtagNode } from "@lexical/hashtag";
import { $generateHtmlFromNodes } from "@lexical/html";

import { client } from "@utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { theme } from "@styles/lexical-theme";
import type { Note } from "../Notes";

export const initialConfig = {
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
  onError: console.error,
};

export const getInitialEditorState = (note: NoteType) => {
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

type NoteType = Note & { type: "note" };

const NoteEditor: React.FC<{
  note: NoteType;
}> = ({ note }) => {
  const queryClient = useQueryClient();

  const updateNoteContent = useMutation({
    mutationFn: async ({
      id,
      content,
      contentLexical,
      contentHTML,
    }: {
      id: string;
      content: string;
      contentLexical: string;
      contentHTML: string;
    }) => {
      const res = await client.api.note[":id"].content.$put({
        param: { id },
        json: { content, contentLexical, contentHTML },
      });
      return await parseResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const contentEditableRef = useRef<HTMLDivElement>(null);

  return (
    <LexicalComposer
      key={note.id}
      initialConfig={{
        ...initialConfig,
        editorState: getInitialEditorState(note),
      }}
    >
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
        onChange={(editorState, editor) => {
          const editorStateJSON = editorState.toJSON();
          editorState.read(() => {
            const root = $getRoot();

            const htmlString = $generateHtmlFromNodes(editor, null);
            console.log("htmlString", htmlString);

            updateNoteContent.mutate({
              id: note.id,
              content: root.getTextContent(),
              contentLexical: JSON.stringify(editorStateJSON),
              contentHTML: htmlString,
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
