import { formatDate } from "@utils/date";
import React from "react";
import AuthorName from "./ui/AuthorName";

export const Article: React.FC<{
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  userId: string | null | undefined;
  authorName: string;
  authorId: string | null | undefined;
  shouldAddByToAuthorName?: boolean;
}> = ({ id, title, description, authorName, createdAt, userId, authorId, shouldAddByToAuthorName = false }) => {
  return (
    <li className="list-row after:inset-x-[0px] px-0 gap-0 first:pt-0 last:pb-0">
      <div></div>
      <div className="min-w-0">
        <svg
          width="13"
          height="19"
          viewBox="0 0 13 19"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-0 -ml-8 mt-1"
        >
          <path
            d="M11.6594 1.04521C11.6234 0.991192 10.868 0.948741 9.48533 1.14531C8.15392 1.3346 7.39585 2.81251 6.81227 4.0972C5.47088 7.05019 6.27575 10.1912 5.90923 13.2256C5.71244 14.8547 5.06317 16.2459 4.28681 17.2859C3.90171 17.8018 3.2492 18.0462 2.69132 17.9567C2.13344 17.8673 1.617 17.3734 1.30898 16.799C0.705916 15.6743 1.06821 14.3242 1.6885 13.2253C2.59132 12.3501 3.98145 11.6719 5.64363 11.1636C6.45168 10.9449 7.18776 10.806 9.38721 10.5849"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <a className="block" href={`/article/${id}`}>
          <div className="text-lg font-serif text-black">{title}</div>
          {description ? (
            <div
              className="mb-1 text-sm truncate text-content-medium"
              title={description.slice(0, 100)}
            >
              {description}
            </div>
          ) : null}
        </a>
        <div className="text-sm text-content-light">
          {authorId && (
            <>
              <AuthorName
                ownerId={authorId || ""}
                ownerName={authorName}
                userId={userId}
                shouldAddBy={shouldAddByToAuthorName}
              />
              {" "}·{" "}
            </>
          )}
          <span>{formatDate(createdAt)}</span> ·{" "}
          <span>
            <a>200 comments</a>
          </span>
        </div>
      </div>
    </li>
  );
};

export default Article;
