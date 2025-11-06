import { useQueryClient, useMutation, QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { client } from "@utils/api";
import { parseResponse } from "hono/client";
import { useState } from "react";
import { createPortal } from "react-dom";

export const queryClient = new QueryClient();

const CreateProjectModal: React.FC<{}> = ({}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = () => {
    window.location.reload();
  }

  return <QueryClientProvider client={queryClient}>
    <button
      className="btn btn-ghost btn-xs p-0 is-drawer-close:mx-auto is-drawer-close:tooltip is-drawer-close:tooltip-right flex items-center justify-center"
      data-tip="Add project"
      onClick={() => setIsOpen(true)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        className="size-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4.5v15m7.5-7.5h-15"
        ></path>
      </svg>
    </button>
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} onSuccess={handleSuccess} />
  </QueryClientProvider>
}


const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const {
    mutate: createProjectMutation,
    error,
    isPending,
  } = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      isPublic: boolean;
    }) => {
      const response = await client.api.projects.$post({ json: data });
      return await parseResponse(response);
    },
    onSuccess: () => {
      setName("");
      setDescription("");
      setIsPublic(false);
      onClose();
      onSuccess();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createProjectMutation({ name, description, isPublic });
  };  

  if (!isOpen) return null;

  return createPortal(
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Create New Project</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-control w-full mb-4">
            <label className="label text-sm mb-1">
              <span className="label-text">Project Name</span>
            </label>
            <input
              type="text"
              placeholder="Enter project name"
              className="input input-bordered w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-control w-full mb-4">
            <label className="label text-sm mb-1">
              <span className="label-text">Description (optional)</span>
            </label>
            <textarea
              placeholder="Enter project description"
              className="textarea textarea-bordered w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-control mb-4">
            <label className="label text-sm mb-1 cursor-pointer justify-start gap-2">
              <input
                type="checkbox"
                className="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <span className="label-text">Make this project public</span>
            </label>
          </div>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{(error as Error).message}</span>
            </div>
          )}

          <div className="modal-action">
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isPending}
            >
              {isPending ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>,
    document.body
  );
};

export default CreateProjectModal;
