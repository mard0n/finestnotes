import type { ProjectType } from "@finest/utils/types";
import { useQuery } from "@tanstack/react-query";
import { client } from "@utils/api";
import { parseResponse } from "hono/client";

export const useProjects = () => {
  const { data: projects, isLoading: isProjectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async (): Promise<ProjectType[]> => {
      const res = await client.api.user.projects.$get();
      return await parseResponse(res);
    },
  });
  return { projects, isProjectsLoading };
};
