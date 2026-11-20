import api from "./api";

export interface ContactSubmission {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

interface ContactResponse {
  status: "success";
  message: string;
}

export async function sendContactMessage(
  submission: ContactSubmission,
): Promise<ContactResponse> {
  const response = await api.post<ContactResponse>("/contact", submission);
  return response.data;
}
