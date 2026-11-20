import api from "./api";

export interface Executive {
  id: number;
  name: string;
  position: string;
  image: string;
}

interface ExecutivesResponse {
  status: "success";
  data: Executive[];
}

export async function getExecutives(
  signal?: AbortSignal,
): Promise<Executive[]> {
  const response = await api.get<ExecutivesResponse>("/executives", { signal });
  return response.data.data;
}
