import api from "./api";

export interface MemberSession {
  status: "success";
  membership_id: string;
  name: string;
}

interface MemberMessage {
  status: "success";
  message: string;
}

export async function getMemberSession(): Promise<MemberSession> {
  const response = await api.get<MemberSession>("/member-auth/session", {
    withCredentials: true,
  });
  return response.data;
}

export async function registerMemberAccount(input: {
  email: string;
  password: string;
}): Promise<MemberMessage> {
  const response = await api.post<MemberMessage>(
    "/member-auth/register",
    input,
    { withCredentials: true },
  );
  return response.data;
}

export async function verifyMemberEmail(token: string): Promise<MemberMessage> {
  const response = await api.post<MemberMessage>("/member-auth/verify-email", {
    token,
  });
  return response.data;
}

export async function loginMember(input: {
  email: string;
  password: string;
}): Promise<MemberSession> {
  const response = await api.post<MemberSession>("/member-auth/login", input, {
    withCredentials: true,
  });
  return response.data;
}

export async function logoutMember(): Promise<void> {
  await api.post("/member-auth/logout", {}, { withCredentials: true });
}
