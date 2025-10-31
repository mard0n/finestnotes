import AddToProjectDropdown from "@components/AddToProjectDropdown";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Article } from "@utils/types";
import type { User } from "better-auth";

export const queryClient = new QueryClient();

export const ArticleActionBar: React.FC<{
  article: Article;
  user: User | null;
}> = ({ article, user }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ActionBar article={article} user={user} />
    </QueryClientProvider>
  );
};

const ActionBar: React.FC<{ article: Article; user: User | null }> = ({
  article,
  user,
}) => {
  return (
    <div className="mb-4 flex justify-between items-center">
      <div className="flex gap-2 md:gap-4">
        <button className="btn btn-ghost btn-sm rounded-full bg-white font-normal">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className=""
          >
            <path d="M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
          </svg>
          321
        </button>
        {article.url ? (
          <a
            href={article.url}
            className="link link-hover btn btn-ghost btn-sm rounded-full bg-white font-normal"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-arrow-up-right-icon lucide-arrow-up-right"
            >
              <>
                <path d="M7 7h10v10" />
                <path d="M7 17 17 7" />
              </>
            </svg>
            <span className="hidden md:inline">
              Visit
            </span>
          </a>
        ) : null}
      </div>
      <div className="flex gap-2 md:gap-4">
        <button className="btn btn-ghost btn-sm rounded-full bg-white font-normal">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="size-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
            ></path>
          </svg>
          <span className="hidden md:inline">
            Save
          </span>
        </button>
        <div className="dropdown dropdown-end">
          <button className="btn btn-ghost btn-sm rounded-full bg-white font-normal">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="size-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 10.5v6m3-3H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
              ></path>
            </svg>
            <span className="hidden md:inline">
              Add to project
            </span>
          </button>
          <div className="dropdown-content menu z-1 p-2 w-xs">
            <AddToProjectDropdown
              noteId={article.id}
              noteProjectIds={article.projects.map((p) => p.id)}
              onProjectsChange={() => {
                window.location.reload();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleActionBar;
