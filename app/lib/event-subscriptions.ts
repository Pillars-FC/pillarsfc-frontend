import api from "./api";

interface EventSubscriptionResponse {
  status: "success";
  message: string;
}

export async function subscribeToClubEvents(
  email: string,
): Promise<EventSubscriptionResponse> {
  const response = await api.post<EventSubscriptionResponse>(
    "/event-subscriptions",
    { email },
  );
  return response.data;
}
