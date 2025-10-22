import React, { useState } from 'react';
import type { Collections } from './Notes';

interface AnnotationEditorProps {
  annotation: Collections[number] & { type: 'page' };
}

export const AnnotationEditor: React.FC<AnnotationEditorProps> = ({ annotation }) => {

  return (
    <div className="annotation-editor">
      <h1 contentEditable>{annotation.title}</h1>
      {annotation.content ? (
        <div>
          {annotation.content && annotation.content.map((content, index) => {
            if (content.type === "highlight") {
              return <div key={index} contentEditable className="highlight">
                {content.text}
              </div>
            } else if (content.type === "image") {
              return <div key={index} className="image-annotation">
                <img src={content.imageUrl} alt={content.caption || ""} />
              </div>
            } else {
              return null;
            }
          })}
        </div>
      ) : <p>No content</p>}
    </div>
  );
};