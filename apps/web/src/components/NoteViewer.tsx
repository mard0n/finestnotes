import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { getInitialEditorState, initialConfig } from "../pages/notes/_components/editors-viewers/NoteEditor";
import type { WritingType } from "@finest/utils/types";

const NoteViewer: React.FC<{
  note: WritingType;
}> = ({ note }) => {
  return (
    <LexicalComposer
      initialConfig={{
        ...initialConfig,
        editorState: getInitialEditorState(note),
        editable: false,
      }}
    >
      <div className="relative grow">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="h-full outline-none text-sm"
              aria-placeholder={"What's on your mind?"}
              placeholder={
                <div className="absolute left-0 top-0 pointer-events-none text-content-light">
                  Take a note...
                </div>
              }
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
      </div>
      {/* <TreeViewPlugin /> */}
    </LexicalComposer>
  );
};

export default NoteViewer;
