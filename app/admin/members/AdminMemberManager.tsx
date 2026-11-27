"use client";

import axios from "axios";
import { useEffect, useState, type FormEvent } from "react";
import {
  deleteMember,
  getAdminMembers,
  updateMember,
  type AdminMember,
  type MemberUpdate,
  type MembershipStatus,
  type PreferredPosition,
} from "../../lib/members";

const PAGE_SIZE = 20;

interface AdminMemberManagerProps {
  refreshToken: number;
  onSessionExpired: () => void;
}

export default function AdminMemberManager({
  refreshToken,
  onSessionExpired,
}: AdminMemberManagerProps) {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | MembershipStatus>("");
  const [selectedMember, setSelectedMember] = useState<AdminMember | null>(null);
  const [loadedRequest, setLoadedRequest] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [busyMemberId, setBusyMemberId] = useState("");
  const [feedback, setFeedback] = useState("");
  const [hasError, setHasError] = useState(false);
  const requestKey = `${skip}:${search}:${statusFilter}:${refreshToken}`;
  const isLoading = loadedRequest !== requestKey;

  useEffect(() => {
    const controller = new AbortController();
    const currentRequest = `${skip}:${search}:${statusFilter}:${refreshToken}`;
    getAdminMembers(
      {
        skip,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: statusFilter || undefined,
      },
      controller.signal,
    )
      .then((response) => {
        if (controller.signal.aborted) return;
        setMembers(response.data);
        setTotal(response.total);
        setFeedback("");
        setHasError(false);
      })
      .catch((error: unknown) => {
        if (axios.isCancel(error) || controller.signal.aborted) return;
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          onSessionExpired();
          return;
        }
        console.error("Failed to load admin members:", error);
        setFeedback("Could not load members. Please try again.");
        setHasError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadedRequest(currentRequest);
      });

    return () => controller.abort();
  }, [onSessionExpired, refreshToken, search, skip, statusFilter]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSkip(0);
    setSearch(searchText.trim());
    setFeedback("");
    setHasError(false);
  };

  const handleUpdate = async (values: MemberUpdate) => {
    if (!selectedMember) return;
    setIsSaving(true);
    setFeedback("");
    setHasError(false);
    try {
      const updated = await updateMember(selectedMember.membership_id, values);
      setMembers((current) =>
        current.map((member) =>
          member.membership_id === updated.membership_id ? updated : member,
        ),
      );
      setSelectedMember(null);
      setFeedback(`Updated ${updated.name}.`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        onSessionExpired();
        return;
      }
      console.error("Failed to update member:", error);
      const errorStatus = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (errorStatus === 409) {
        setFeedback("That email address is already used by another member account.");
      } else if (errorStatus === 413) {
        setFeedback("The image must be 5 MB or smaller.");
      } else if (errorStatus === 415) {
        setFeedback("Choose a JPEG, PNG, or WebP image.");
      } else if (errorStatus === 503 && values.image) {
        setFeedback("Image uploads are not configured on the server.");
      } else if (errorStatus === 502) {
        setFeedback("The image upload failed. Please try again.");
      } else {
        setFeedback("Could not update this member. Please try again.");
      }
      setHasError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (member: AdminMember) => {
    const confirmed = window.confirm(
      `Permanently delete ${member.name} (${member.membership_id}) and their member login? This cannot be undone. Their approved application and Player of the Month history will be kept.`,
    );
    if (!confirmed) return;

    setBusyMemberId(member.membership_id);
    setFeedback("");
    setHasError(false);
    try {
      await deleteMember(member.membership_id);
      const updatedTotal = Math.max(0, total - 1);
      setMembers((current) =>
        current.filter((entry) => entry.membership_id !== member.membership_id),
      );
      setTotal(updatedTotal);
      if (selectedMember?.membership_id === member.membership_id) {
        setSelectedMember(null);
      }
      if (skip > 0 && members.length === 1) {
        setSkip(Math.max(0, skip - PAGE_SIZE));
      }
      setFeedback(`Permanently deleted ${member.name} and their member login.`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        onSessionExpired();
        return;
      }
      console.error("Failed to delete member:", error);
      setFeedback("Could not delete this member. Please try again.");
      setHasError(true);
    } finally {
      setBusyMemberId("");
    }
  };

  return (
    <section className="mt-8 bg-white p-7 shadow-[0_6px_26px_rgba(13,35,50,.06)] sm:p-10">
      <div>
        <h2 className="font-condensed text-4xl font-extrabold uppercase text-[#071b33]">
          Approved members
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Update contact details, position, photo, or access status. Inactive members
          cannot sign in.
        </p>
      </div>

      {selectedMember && (
        <EditMemberForm
          key={selectedMember.membership_id}
          member={selectedMember}
          isSaving={isSaving}
          onCancel={() => setSelectedMember(null)}
          onSubmit={handleUpdate}
        />
      )}

      <form
        onSubmit={handleSearch}
        className="mt-7 flex flex-col gap-3 sm:flex-row"
      >
        <label className="flex-1">
          <span className="sr-only">Search members</span>
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search name, email, or membership ID"
            maxLength={100}
            className="w-full border border-slate-200 p-3 text-sm outline-none focus:border-[#075aa6]"
          />
        </label>
        <label>
          <span className="sr-only">Filter by member status</span>
          <select
            value={statusFilter}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setStatusFilter(value === "active" || value === "inactive" ? value : "");
              setSkip(0);
              setFeedback("");
              setHasError(false);
            }}
            className="w-full border border-slate-200 p-3 text-sm outline-none focus:border-[#075aa6] sm:w-auto"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <button
          type="submit"
          className="bg-[#075aa6] px-5 py-3 text-xs font-extrabold text-white"
        >
          SEARCH
        </button>
      </form>

      {feedback && (
        <p
          role={hasError ? "alert" : "status"}
          className={`mt-4 text-sm ${hasError ? "text-red-700" : "text-green-700"}`}
        >
          {feedback}
        </p>
      )}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] font-extrabold tracking-wider text-slate-500">
              <th className="px-3 py-3">MEMBER</th>
              <th className="px-3 py-3">CONTACT</th>
              <th className="px-3 py-3">POSITION</th>
              <th className="px-3 py-3">STATUS</th>
              <th className="px-3 py-3">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                  Loading members...
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                  No members found.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr
                  key={member.membership_id}
                  className="border-b border-slate-100 align-top"
                >
                  <td className="px-3 py-4">
                    <p className="font-bold text-[#071b33]">{member.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {member.membership_id}
                    </p>
                  </td>
                  <td className="px-3 py-4 text-xs leading-5 text-slate-600">
                    <p>{member.email}</p>
                    <p>{member.phone}</p>
                  </td>
                  <td className="px-3 py-4 text-xs text-slate-600">
                    {member.preferred_position ?? "Not set"}
                  </td>
                  <td className="px-3 py-4">
                    <span
                      className={`text-xs font-bold ${
                        member.status === "active" ? "text-green-700" : "text-slate-500"
                      }`}
                    >
                      {member.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedMember(member)}
                        className="border border-slate-200 px-3 py-2 text-[10px] font-extrabold text-[#075aa6]"
                      >
                        EDIT
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(member)}
                        disabled={busyMemberId === member.membership_id}
                        className="border border-red-200 px-3 py-2 text-[10px] font-extrabold text-red-700 disabled:opacity-50"
                      >
                        {busyMemberId === member.membership_id ? "DELETING..." : "DELETE"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <p>
          {total === 0
            ? "0 members"
            : `${skip + 1}-${Math.min(skip + members.length, total)} of ${total} members`}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSkip((current) => Math.max(0, current - PAGE_SIZE))}
            disabled={skip === 0 || isLoading}
            className="border border-slate-200 px-3 py-2 font-bold disabled:opacity-40"
          >
            PREVIOUS
          </button>
          <button
            type="button"
            onClick={() => setSkip((current) => current + PAGE_SIZE)}
            disabled={skip + members.length >= total || isLoading}
            className="border border-slate-200 px-3 py-2 font-bold disabled:opacity-40"
          >
            NEXT
          </button>
        </div>
      </div>
    </section>
  );
}

interface EditMemberFormProps {
  member: AdminMember;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (values: MemberUpdate) => Promise<void>;
}

function EditMemberForm({
  member,
  isSaving,
  onCancel,
  onSubmit,
}: EditMemberFormProps) {
  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email);
  const [phone, setPhone] = useState(member.phone);
  const [address, setAddress] = useState(member.address);
  const [preferredPosition, setPreferredPosition] = useState<PreferredPosition>(
    member.preferred_position ?? "Midfielder",
  );
  const [status, setStatus] = useState<MembershipStatus>(member.status);
  const [image, setImage] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit({
      name,
      email,
      phone,
      address,
      preferred_position: preferredPosition,
      status,
      image,
      remove_image: removeImage,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 grid gap-4 border border-slate-200 bg-slate-50 p-5 sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <h3 className="font-condensed text-2xl font-extrabold uppercase text-[#071b33]">
          Edit {member.name}
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Membership ID, join date, and registrations are unchanged.
        </p>
      </div>
      <label>
        <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
          FULL NAME
        </span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          minLength={2}
          maxLength={120}
          autoComplete="name"
          className="mt-2 w-full border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[#075aa6]"
        />
      </label>
      <label>
        <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
          EMAIL
        </span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          maxLength={254}
          autoComplete="email"
          className="mt-2 w-full border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[#075aa6]"
        />
      </label>
      <label>
        <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
          PHONE NUMBER
        </span>
        <input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          required
          minLength={7}
          maxLength={30}
          autoComplete="tel"
          className="mt-2 w-full border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[#075aa6]"
        />
      </label>
      <label>
        <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
          PREFERRED POSITION
        </span>
        <select
          value={preferredPosition}
          onChange={(event) => {
            const value = event.currentTarget.value;
            if (
              value === "Goalkeeper" ||
              value === "Defender" ||
              value === "Midfielder" ||
              value === "Forward"
            ) {
              setPreferredPosition(value);
            }
          }}
          className="mt-2 w-full border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[#075aa6]"
        >
          <option value="Goalkeeper">Goalkeeper</option>
          <option value="Defender">Defender</option>
          <option value="Midfielder">Midfielder</option>
          <option value="Forward">Forward</option>
        </select>
      </label>
      <label className="sm:col-span-2">
        <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
          ADDRESS
        </span>
        <textarea
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          required
          minLength={5}
          maxLength={300}
          autoComplete="street-address"
          rows={2}
          className="mt-2 w-full border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[#075aa6]"
        />
      </label>
      <label>
        <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
          MEMBER STATUS
        </span>
        <select
          value={status}
          onChange={(event) =>
            setStatus(event.currentTarget.value === "inactive" ? "inactive" : "active")
          }
          className="mt-2 w-full border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[#075aa6]"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </label>
      <label>
        <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
          REPLACE PROFILE PHOTO (OPTIONAL)
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            setImage(event.currentTarget.files?.[0] ?? null);
            setRemoveImage(false);
          }}
          className="mt-2 block w-full text-xs text-slate-600 file:mr-3 file:border-0 file:bg-white file:px-3 file:py-2 file:text-[10px] file:font-bold"
        />
      </label>
      {member.image_url && (
        <label className="flex items-center gap-2 text-xs text-slate-600 sm:col-span-2">
          <input
            type="checkbox"
            checked={removeImage}
            onChange={(event) => {
              setRemoveImage(event.currentTarget.checked);
              if (event.currentTarget.checked) setImage(null);
            }}
          />
          Remove the current profile photo
        </label>
      )}
      <div className="flex gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={isSaving}
          className="bg-[#f6b71d] px-5 py-3 text-xs font-extrabold text-[#152238] disabled:opacity-50"
        >
          {isSaving ? "SAVING..." : "SAVE CHANGES"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="border border-slate-200 px-5 py-3 text-xs font-extrabold text-[#071b33] disabled:opacity-50"
        >
          CANCEL
        </button>
      </div>
    </form>
  );
}
