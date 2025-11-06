import { useState } from "react";
import NoteList from "./NoteList";
import Sidebar from "./Sidebar";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { client } from "@utils/api";
import { parseResponse } from "hono/client";
import { authClient } from "@utils/auth";

export type FilterType =
  | { type: "all" | "private" | "public" }
  | { type: "project"; id: string };

export const queryClient = new QueryClient();

const NotesWrapper: React.FC<{}> = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Notes />
    </QueryClientProvider>
  );
};

const Notes: React.FC<{}> = () => {
  const [filter, setFilter] = useState<FilterType>({ type: "all" });
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await client.api.projects.$get({
        param: { id: (filter as FilterType & { type: "project" }).id },
      });
      return await parseResponse(res);
    },
  });

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await authClient.getSession();
      if (res.data) {
        return res.data.user;
      } else {
        return null;
      }
    },
  });

  return (
    <div className="drawer drawer-open">
      <input
        id="my-drawer-4"
        type="checkbox"
        className="drawer-toggle"
        defaultChecked
      />
      <div className="drawer-side is-drawer-close:overflow-visible">
        <label
          htmlFor="my-drawer-4"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <div className="is-drawer-close:w-14 is-drawer-open:w-64 bg-base-200 flex flex-col items-start min-h-full border-r border-neutral-300">
          <div className="w-full grow py-0">
            <Sidebar
              filter={filter}
              setFilter={setFilter}
              projects={projects}
            />
          </div>

          <div
            className="m-2 is-drawer-close:tooltip is-drawer-close:tooltip-right"
            data-tip="Open"
          >
            <label
              htmlFor="my-drawer-4"
              className="btn btn-ghost btn-circle drawer-button is-drawer-open:rotate-y-180"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                stroke-linejoin="round"
                stroke-linecap="round"
                stroke-width="2"
                fill="none"
                stroke="currentColor"
                className="inline-block size-4 my-1.5"
              >
                <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
                <path d="M9 4v16"></path>
                <path d="M14 10l2 2l-2 2"></path>
              </svg>
            </label>
          </div>
        </div>
      </div>
      <div className="drawer-content">
        <div className="w-sm border-r border-neutral-300 h-full">
          <NoteList
            filter={filter}
            user={user}
            selectedNoteId={selectedNoteId}
            setSelectedNoteId={setSelectedNoteId}
          />
        </div>
      </div>
    </div>
  );
};

export default NotesWrapper;
