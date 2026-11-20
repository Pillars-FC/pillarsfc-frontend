import api from "./api";
import type { PreferredPosition } from "./members";

export type MemberApplicationStatus =
  | "pending"
  | "approving"
  | "approved"
  | "rejected";

export interface MemberApplication {
  application_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  preferred_position: PreferredPosition;
  date_of_birth: string | null;
  image_url: string | null;
  status: MemberApplicationStatus;
  submitted_at: string;
  consented_at: string;
  membership_id: string | null;
}

interface ApplicationsResponse {
  status: "success";
  data: MemberApplication[];
  total: number;
}

interface ApplicationResponse {
  status: "success";
  data: MemberApplication;
}

interface SubmissionResponse {
  status: "success";
  data: {
    application_id: string;
    status: "pending";
  };
}

export async function submitMemberApplication(
  formData: FormData,
): Promise<SubmissionResponse["data"]> {
  const response = await api.post<SubmissionResponse>(
    "/members/applications",
    formData,
    { timeout: 30_000 },
  );
  return response.data.data;
}

export async function getMemberApplications(): Promise<MemberApplication[]> {
  const response = await api.get<ApplicationsResponse>("/admin/applications", {
    withCredentials: true,
  });
  return response.data.data;
}

export async function approveMemberApplication(
  applicationId: string,
): Promise<MemberApplication> {
  const response = await api.post<ApplicationResponse>(
    `/admin/applications/${encodeURIComponent(applicationId)}/approve`,
    {},
    { withCredentials: true },
  );
  return response.data.data;
}

export async function rejectMemberApplication(
  applicationId: string,
): Promise<MemberApplication> {
  const response = await api.post<ApplicationResponse>(
    `/admin/applications/${encodeURIComponent(applicationId)}/reject`,
    {},
    { withCredentials: true },
  );
  return response.data.data;
}
