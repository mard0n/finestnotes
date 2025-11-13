import React from "react";
import type { Note } from "../pages/notes/_components/Notes";

type AnnotationType = Note & { type: "page" };

interface AnnotationViewerProps {
  annotation: AnnotationType;
}

const AnnotationViewer: React.FC<AnnotationViewerProps> = ({ annotation }) => {
  return (
    <div className="flex flex-col">
      {annotation.annotations && annotation.annotations.length > 0 ? (
        <div className="flex text-sm flex-col gap-4 overflow-y-auto">
          {annotation.annotations.map((content) => {
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
        <p className="pointer-events-none text-base-content">
          No highlights. No annotations
        </p>
      )}
    </div>
  );
};

type HighlightContentType = AnnotationType["annotations"][number] & {
  type: "highlight";
};

const HighlightComponent: React.FC<{
  highlight: HighlightContentType;
}> = ({ highlight }) => {
  return (
    <div>
      <blockquote className="text-md pl-5 text-content-medium/90 italic relative before:content-[''] before:absolute before:left-0 before:top-0 before:w-0.5 before:h-full before:bg-content-light">
        {highlight.text}
      </blockquote>
      {highlight.comment && (
        <div className="pl-5 pt-2 w-full flex items-center gap-2">
          <svg
            width="18"
            height="24"
            viewBox="0 0 18 24"
            fill="none"
            strokeWidth={1.5}
            stroke="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            className="text-content-light"
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
          <span className="text-md mt-2">{highlight.comment}</span>
        </div>
      )}
    </div>
  );
};

type ImageContentType = AnnotationType["annotations"][number] & {
  type: "image";
};

const ImageComponent: React.FC<{
  image: ImageContentType;
}> = ({ image }) => {
  return (
    <div className="image-annotation">
      <img src={image.imageUrl} />
    </div>
  );
};

export default AnnotationViewer;
