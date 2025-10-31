import { useQueryClient, useMutation } from "@tanstack/react-query";
import { client } from "@utils/api";
import { parseResponse } from "hono/client";
import { useState } from "react";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setName("");
      setDescription("");
      setIsPublic(false);
      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createProjectMutation({ name, description, isPublic });
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Create New Project</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-control w-full mb-4">
            <label className="label">
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
            <label className="label">
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
            <label className="label cursor-pointer justify-start gap-2">
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
    </div>
  );
};

export default CreateProjectModal;