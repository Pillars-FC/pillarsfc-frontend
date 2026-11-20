import api from "./api";

export type PollPhase = "nominations" | "finalizing" | "voting" | "closed";

export interface PlayerCandidate {
  membership_id: string;
  name: string;
  image_url: string | null;
  nomination_count: number;
}

export interface PlayerOfTheMonthWinner {
  round_id: string;
  award_period: string;
  membership_id: string;
  name: string;
  image_url: string;
  description: string;
  published_at: string;
}

export interface PublicPlayerRound {
  round_id: string;
  award_period: string;
  phase: "nominations" | "voting";
  candidates: PlayerCandidate[];
}

export interface MemberPollStatus {
  round_id: string | null;
  phase: PollPhase | null;
  has_nominated: boolean;
  has_voted: boolean;
}

export interface NominatableMember {
  membership_id: string;
  name: string;
  image_url: string | null;
  preferred_position: string | null;
}

export interface AdminCandidate extends PlayerCandidate {
  vote_count: number;
}

export interface AdminPlayerRound {
  round_id: string;
  award_period: string;
  phase: PollPhase;
  nomination_count: number;
  nominations: Array<{
    membership_id: string;
    name: string;
    image_url: string | null;
    nomination_count: number;
  }>;
  candidates: AdminCandidate[];
  winner: PlayerOfTheMonthWinner | null;
}

interface DataResponse<T> {
  status: "success";
  data: T;
}

interface ActionResponse {
  status: "success";
  message: string;
}

export async function getPlayerOfTheMonth(): Promise<PlayerOfTheMonthWinner | null> {
  const response = await api.get<DataResponse<PlayerOfTheMonthWinner | null>>(
    "/player-of-the-month",
  );
  return response.data.data;
}

export async function getPublicPlayerRound(): Promise<PublicPlayerRound | null> {
  const response = await api.get<DataResponse<PublicPlayerRound | null>>(
    "/player-of-the-month/poll",
  );
  return response.data.data;
}

export async function getMemberPollStatus(): Promise<MemberPollStatus> {
  const response = await api.get<DataResponse<MemberPollStatus>>(
    "/player-of-the-month/member/poll",
    { withCredentials: true },
  );
  return response.data.data;
}

export async function getNominatableMembers(
  search: string,
  signal?: AbortSignal,
): Promise<NominatableMember[]> {
  const response = await api.get<DataResponse<NominatableMember[]>>(
    "/player-of-the-month/member/members",
    {
      params: { search: search || undefined },
      signal,
      withCredentials: true,
    },
  );
  return response.data.data;
}

export async function nominatePlayer(membershipId: string): Promise<string> {
  const response = await api.post<ActionResponse>(
    "/player-of-the-month/member/nominations",
    { membership_id: membershipId },
    { withCredentials: true },
  );
  return response.data.message;
}

export async function voteForPlayer(
  candidateMembershipId: string,
): Promise<string> {
  const response = await api.post<ActionResponse>(
    "/player-of-the-month/member/votes",
    { candidate_membership_id: candidateMembershipId },
    { withCredentials: true },
  );
  return response.data.message;
}

export async function getAdminPlayerRound(): Promise<AdminPlayerRound | null> {
  const response = await api.get<DataResponse<AdminPlayerRound | null>>(
    "/admin/player-of-the-month",
    { withCredentials: true },
  );
  return response.data.data;
}

export async function openPlayerRound(
  awardPeriod: string,
): Promise<AdminPlayerRound> {
  const response = await api.post<DataResponse<AdminPlayerRound>>(
    "/admin/player-of-the-month",
    { award_period: awardPeriod },
    { withCredentials: true },
  );
  return response.data.data;
}

export async function advancePlayerRound(
  roundId: string,
): Promise<AdminPlayerRound> {
  const response = await api.post<DataResponse<AdminPlayerRound>>(
    `/admin/player-of-the-month/${encodeURIComponent(roundId)}/advance`,
    {},
    { withCredentials: true },
  );
  return response.data.data;
}

export async function closePlayerRound(
  roundId: string,
  description: string,
  image: File,
): Promise<AdminPlayerRound> {
  const formData = new FormData();
  formData.append("description", description);
  formData.append("image", image);
  const response = await api.post<DataResponse<AdminPlayerRound>>(
    `/admin/player-of-the-month/${encodeURIComponent(roundId)}/close`,
    formData,
    { withCredentials: true, timeout: 30_000 },
  );
  return response.data.data;
}
