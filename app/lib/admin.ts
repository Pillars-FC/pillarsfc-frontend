import api from "./api";

export interface AdminSession {
  status: "success";
  username: string;
}

interface AdminLogin {
  username: string;
  password: string;
}

export async function getAdminSession(): Promise<AdminSession> {
  const response = await api.get<AdminSession>("/admin/session", {
    withCredentials: true,
  });
  return response.data;
}

export async function loginAdmin(credentials: AdminLogin): Promise<AdminSession> {
  const response = await api.post<AdminSession>(
    "/admin/login",
    credentials,
    { withCredentials: true },
  );
  return response.data;
}

export async function logoutAdmin(): Promise<void> {
  await api.post(
    "/admin/logout",
    {},
    { withCredentials: true },
  );
}
