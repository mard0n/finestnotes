import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { client } from "@utils/api";
import { parseResponse } from "hono/client";
import GlobeIcon from "@assets/globe.svg?react";
import LockIcon from "@assets/lock.svg?react";

const NoteVisibilityButtonWrapper: React.FC<{
  noteId: string;
  isPublic: boolean;
  onSuccess?: () => void;
  queryClient?: QueryClient;
}> = ({ noteId, isPublic, onSuccess, queryClient }) => {
  const queryClientInstance = queryClient || new QueryClient();
  return (
    <QueryClientProvider client={queryClientInstance}>
      <NoteVisibilityButton
        noteId={noteId}
        isPublic={isPublic}
        onSuccess={onSuccess}
      />
    </QueryClientProvider>
  );
};

const NoteVisibilityButton: React.FC<{
  noteId: string;
  isPublic: boolean;
  onSuccess?: () => void;
}> = ({ noteId, isPublic, onSuccess }) => {
  const queryClient = useQueryClient();

  const updateNoteVisibility = useMutation({
    mutationFn: async ({ id, isPublic }: { id: string; isPublic: boolean }) => {
      const res = await client.api.note[":id"].visibility.$put({
        param: { id: id.toString() },
        json: { isPublic },
      });
      return await parseResponse(res);
    },
    onSuccess: () => {
      onSuccess?.();
    },
  });

  const handleVisibilityChange = (isPublic: boolean) => {
    if (noteId) {
      updateNoteVisibility.mutate({ id: noteId, isPublic });
    }
  };

  return (
    <div className="dropdown dropdown-top md:dropdown-bottom">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-sm rounded-full bg-white font-normal truncate"
      >
        <span>{isPublic ? <GlobeIcon /> : <LockIcon />}</span>
        <span className="hidden xs:inline">
          {isPublic ? "Public" : "Private"}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="size-5"
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div tabIndex={-1} className="dropdown-content p-2 z-1">
        <ul className="menu p-2 bg-white border border-neutral-300">
          <li>
            <div className="flex gap-3 items-center">
              <input
                type="radio"
                id={`private`}
                name={`visibility`}
                className="radio radio-xs"
                checked={!isPublic}
                onChange={() => handleVisibilityChange(false)}
              />
              <label
                htmlFor={`private`}
                className="flex gap-1 items-center cursor-pointer"
              >
                <LockIcon /> Private
              </label>
            </div>
          </li>
          <li>
            <div className="flex gap-3 items-center">
              <input
                type="radio"
                id={`public`}
                name={`visibility`}
                className="radio radio-xs"
                checked={isPublic}
                onChange={() => handleVisibilityChange(true)}
              />
              <label
                htmlFor={`public`}
                className="flex gap-1 items-center cursor-pointer"
              >
                <GlobeIcon /> Public
              </label>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default NoteVisibilityButtonWrapper;
