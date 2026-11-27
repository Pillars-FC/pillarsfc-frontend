import api from "./api";

export type MembershipStatus = "active" | "inactive";
export type PreferredPosition =
  | "Goalkeeper"
  | "Defender"
  | "Midfielder"
  | "Forward";

export interface Member {
  membership_id: string;
  name: string;
  joined_at: string;
  status: MembershipStatus;
  preferred_position: PreferredPosition | null;
  image_url: string | null;
}

export interface MemberRegistration {
  year: number;
  registered_at: string;
}

export interface MemberDetail extends Member {
  registrations: MemberRegistration[];
}

export interface AdminMember extends Member {
  email: string;
  phone: string;
  address: string;
}

interface MembersResponse {
  status: "success";
  data: Member[];
  total: number;
}

export interface MemberCreate {
  name: string;
  email: string;
  phone: string;
  address: string;
  preferred_position: PreferredPosition;
  image: File | null;
}

export interface MemberUpdate extends MemberCreate {
  status: MembershipStatus;
  remove_image: boolean;
}

interface MemberResponse {
  status: "success";
  data: Member;
}

interface MemberDetailResponse {
  status: "success";
  data: MemberDetail;
}

interface AdminMembersResponse {
  status: "success";
  data: AdminMember[];
  total: number;
}

interface AdminMemberResponse {
  status: "success";
  data: AdminMember;
}

export async function getMembers(
  params: {
    skip: number;
    limit: number;
    search?: string;
    preferred_position?: PreferredPosition;
  },
  signal?: AbortSignal,
): Promise<MembersResponse> {
  const response = await api.get<MembersResponse>("/members", { params, signal });
  return response.data;
}

export async function getMember(
  membershipId: string,
  signal?: AbortSignal,
): Promise<MemberDetail> {
  const response = await api.get<MemberDetailResponse>(
    `/members/${encodeURIComponent(membershipId)}`,
    { signal },
  );
  return response.data.data;
}

export async function registerMemberYear(
  membershipId: string,
  year: number,
): Promise<MemberDetail> {
  const response = await api.post<MemberDetailResponse>(
    `/admin/members/${encodeURIComponent(membershipId)}/registrations`,
    { year },
    { withCredentials: true },
  );
  return response.data.data;
}

export async function createMember(
  member: MemberCreate,
): Promise<Member> {
  const formData = new FormData();
  formData.append("name", member.name);
  formData.append("email", member.email);
  formData.append("phone", member.phone);
  formData.append("address", member.address);
  formData.append("preferred_position", member.preferred_position);
  if (member.image) formData.append("image", member.image);

  const response = await api.post<MemberResponse>(
    "/admin/members",
    formData,
    { withCredentials: true, timeout: 30_000 },
  );
  return response.data.data;
}

export async function getAdminMembers(
  params: {
    skip: number;
    limit: number;
    search?: string;
    status?: MembershipStatus;
  },
  signal?: AbortSignal,
): Promise<AdminMembersResponse> {
  const response = await api.get<AdminMembersResponse>("/admin/members", {
    params,
    signal,
    withCredentials: true,
  });
  return response.data;
}

export async function updateMember(
  membershipId: string,
  member: MemberUpdate,
): Promise<AdminMember> {
  const formData = new FormData();
  formData.append("name", member.name);
  formData.append("email", member.email);
  formData.append("phone", member.phone);
  formData.append("address", member.address);
  formData.append("preferred_position", member.preferred_position);
  formData.append("status", member.status);
  formData.append("remove_image", String(member.remove_image));
  if (member.image) formData.append("image", member.image);

  const response = await api.patch<AdminMemberResponse>(
    `/admin/members/${encodeURIComponent(membershipId)}`,
    formData,
    { withCredentials: true, timeout: 30_000 },
  );
  return response.data.data;
}

export async function deleteMember(membershipId: string): Promise<void> {
  await api.delete(`/admin/members/${encodeURIComponent(membershipId)}`, {
    withCredentials: true,
  });
}
