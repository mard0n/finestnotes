import React, { useRef, useState, useEffect, useCallback } from 'react';
import { type Collections } from './Notes';
import { $getRoot, $getSelection, type LexicalEditor } from 'lexical';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import TreeViewPlugin from "../lexical/plugins/TreeViewPlugin";
import { client } from '@utils/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { parseResponse } from 'hono/client';

interface NoteEditorProps {
  note: Collections[number] & { type: 'note' };
}

const theme = {
  // Theme styling goes here
  //...
}

function onError(error: Error, editor: LexicalEditor) {
  console.error(error);
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
}) => {
  const queryClient = useQueryClient();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingContentRef = useRef<string | null>(null);
  const pendingContentDescriptionRef = useRef<string | null>(null);

  const updateNoteTitle = useMutation({
    mutationFn: async ({ id, title }: { id: number, title: string }) => {
      const res = await client.api.note[':id'].$put({
        param: { id: id.toString() },
        json: { title }
      });
      return await parseResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    }
  });

  const updateNoteContent = useMutation({
    mutationFn: async ({ id, content, contentDescription }: { id: number, content: string, contentDescription: string }) => {
      const res = await client.api.note[':id'].$put({
        param: { id: id.toString() },
        json: { content, contentDescription }
      });
      return await parseResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    }
  });

  const contentEditableRef = useRef<HTMLDivElement>(null);

  const handleNoteTitleEdit = (newTitle: string) => {
    updateNoteTitle.mutate({ id: note.id, title: newTitle })
  }

  const debouncedSave = useCallback((content: string, contentDescription: string) => {
    pendingContentRef.current = content;
    pendingContentDescriptionRef.current = contentDescription;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      updateNoteContent.mutate({ id: note.id, content, contentDescription });
      pendingContentRef.current = null;
      pendingContentDescriptionRef.current = null;
    }, 1000);
  }, [note.id, updateNoteContent]);


  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (pendingContentRef.current && pendingContentDescriptionRef.current) {
        updateNoteContent.mutate({ id: note.id, content: pendingContentRef.current, contentDescription: pendingContentDescriptionRef.current });
      }
    };
  }, [note.id, updateNoteContent]);

  const getInitialEditorState = () => {
    if (!note.content || note.content.trim() === '') {
      return undefined;
    }

    try {
      const parsed = JSON.parse(note.content);
      if (!parsed.root.children || parsed.root.children.length === 0) {
        return undefined;
      }
      return note.content;
    } catch (e) {
      console.error('Failed to parse editor content:', e);
      return undefined;
    }
  };

  const initialConfig = {
    namespace: 'MyEditor',
    theme,
    onError,
    editorState: getInitialEditorState(),
  };

  return (
    <div className='flex flex-col h-full gap-4'>
      <h1
        contentEditable
        className='text-2xl font-serif outline-none'
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData('text/plain');
          document.execCommand('insertText', false, text);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            contentEditableRef.current?.focus();
          }
        }}
        onBlur={(e) => {
          handleNoteTitleEdit(e.target.textContent || 'Untitled');
        }}
        suppressContentEditableWarning
      >
        {note.title}
      </h1>
      <LexicalComposer initialConfig={initialConfig}>
        <div className='relative grow'>
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className='h-full outline-none'
                ref={contentEditableRef}
                aria-placeholder={'What\'s on your mind?'}
                placeholder={<div className='absolute left-0 top-0 pointer-events-none text-gray-content'>Take a note...</div>}
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <OnChangePlugin
          onChange={(editorState) => {
            const editorStateJSON = editorState.toJSON();
            let extractedText = '';

            editorState.read(() => {
              const root = $getRoot();
              extractedText = root.getTextContent().slice(0, 100);
            });

            debouncedSave(JSON.stringify(editorStateJSON), extractedText);
          }}
        />
        {/* <TreeViewPlugin /> */}
      </LexicalComposer>
    </div >
  );
};

export default NoteEditor;
