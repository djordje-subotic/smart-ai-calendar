"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ---- FRIENDS ----

export async function sendFriendRequest(friendEmail: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Find friend by email
  const { data: friendUser } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", (await supabase.rpc("get_user_id_by_email", { email_input: friendEmail })).data)
    .single();

  // Fallback: search auth.users via admin (RLS won't let us query auth.users)
  // Instead, search profiles joined with auth metadata
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, full_name");

  // We need a different approach - let user search by email through a function
  // For now, use Supabase auth admin to find user
  // Simple approach: store email in profiles or use lookup

  // Direct insert with email lookup via Supabase
  const { data: targetUser, error: lookupError } = await supabase
    .rpc("find_user_by_email", { target_email: friendEmail });

  if (lookupError || !targetUser) {
    return { success: false, error: "User not found. They need to sign up for Krowna first." };
  }

  const friendId = targetUser;

  if (friendId === user.id) return { success: false, error: "You can't add yourself" };

  // Check if already friends
  const { data: existing } = await supabase
    .from("friends")
    .select("id")
    .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
    .single();

  if (existing) return { success: false, error: "Already friends or request pending" };

  const { error } = await supabase.from("friends").insert({
    user_id: user.id,
    friend_id: friendId,
    status: "pending",
  });

  if (error) return { success: false, error: error.message };

  // Create notification
  const { data: myProfile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  await supabase.from("notifications").insert({
    user_id: friendId,
    type: "friend_request",
    title: "Friend request",
    message: `${myProfile?.full_name || "Someone"} wants to connect with you`,
    data: { from_user_id: user.id, from_name: myProfile?.full_name },
  });

  return { success: true };
}

export async function respondToFriendRequest(friendshipId: string, accept: boolean): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("friends").update({
    status: accept ? "accepted" : "declined",
  }).eq("id", friendshipId).eq("friend_id", user.id);

  revalidatePath("/settings");
}

export interface FriendProfile {
  id: string;
  friendshipId: string;
  name: string;
  display_name: string | null;
  avatar_url: string | null;
  avatar_preset: string | null;
  city: string | null;
  date_of_birth: string | null;
  occupation: string | null;
  motto: string | null;
  status: string;
}

export async function getFriends(): Promise<FriendProfile[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: friendships } = await supabase
    .from("friends")
    .select("id, user_id, friend_id, status")
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
    .eq("status", "accepted");

  if (!friendships) return [];

  const friends: FriendProfile[] = [];
  for (const f of friendships) {
    const friendId = f.user_id === user.id ? f.friend_id : f.user_id;
    const { data: profile } = await supabase.from("profiles")
      .select("full_name, display_name, avatar_url, avatar_preset, city, date_of_birth, occupation, motto")
      .eq("id", friendId).single();
    friends.push({
      id: friendId,
      friendshipId: f.id,
      name: profile?.full_name || "User",
      display_name: profile?.display_name || null,
      avatar_url: profile?.avatar_url || null,
      avatar_preset: profile?.avatar_preset || null,
      city: profile?.city || null,
      date_of_birth: profile?.date_of_birth || null,
      occupation: profile?.occupation || null,
      motto: profile?.motto || null,
      status: f.status,
    });
  }

  return friends;
}

export async function getPendingRequests(): Promise<Array<{ id: string; fromName: string; fromId: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("friends")
    .select("id, user_id")
    .eq("friend_id", user.id)
    .eq("status", "pending");

  if (!data) return [];

  const requests = [];
  for (const r of data) {
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", r.user_id).single();
    requests.push({ id: r.id, fromName: profile?.full_name || "User", fromId: r.user_id });
  }

  return requests;
}

// ---- EVENT INVITES ----

export async function createEventInvite(params: {
  inviteeId: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
}): Promise<{ success: boolean; error?: string; inviteId?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Check invitee availability
  const { data: conflicts } = await supabase
    .from("events")
    .select("id, title")
    .eq("user_id", params.inviteeId)
    .lte("start_time", params.endTime)
    .gte("end_time", params.startTime);

  const { data: invite, error } = await supabase.from("event_invites").insert({
    organizer_id: user.id,
    invitee_id: params.inviteeId,
    proposed_title: params.title,
    proposed_start: params.startTime,
    proposed_end: params.endTime,
    proposed_location: params.location || null,
    status: conflicts && conflicts.length > 0 ? "negotiating" : "pending",
  }).select().single();

  if (error) return { success: false, error: error.message };

  // Notify invitee
  const { data: myProfile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  const hasConflict = conflicts && conflicts.length > 0;

  await supabase.from("notifications").insert({
    user_id: params.inviteeId,
    type: "event_invite",
    title: hasConflict ? "Event invite (conflict!)" : "Event invite",
    message: `${myProfile?.full_name || "Someone"} invited you to "${params.title}"${hasConflict ? " — conflicts with your schedule" : ""}`,
    data: { invite_id: invite.id, has_conflict: hasConflict, conflicting_events: conflicts },
  });

  return { success: true, inviteId: invite.id };
}

export async function respondToInvite(inviteId: string, action: "accept" | "decline" | "counter", counterData?: {
  start: string;
  end: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: invite } = await supabase
    .from("event_invites")
    .select("*")
    .eq("id", inviteId)
    .single();

  if (!invite) return { success: false, error: "Invite not found" };

  if (action === "accept") {
    // Create event for both users
    const eventBase = {
      title: invite.proposed_title,
      description: null,
      location: invite.proposed_location,
      start_time: invite.counter_start || invite.proposed_start,
      end_time: invite.counter_end || invite.proposed_end,
      all_day: false,
      color: "#06B6D4",
      source: "manual",
      status: "confirmed",
      reminder_minutes: [15],
    };

    // Create for both users
    const { error: orgErr } = await supabase.from("events").insert({ ...eventBase, user_id: invite.organizer_id });
    const { error: invErr } = await supabase.from("events").insert({ ...eventBase, user_id: invite.invitee_id });
    if (orgErr || invErr) {
      return { success: false, error: "Failed to create events for both users" };
    }

    await supabase.from("event_invites").update({
      status: "accepted",
      updated_at: new Date().toISOString(),
    }).eq("id", inviteId);

    // Notify organizer
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
    await supabase.from("notifications").insert({
      user_id: invite.organizer_id,
      type: "invite_accepted",
      title: "Invite accepted!",
      message: `${profile?.full_name || "Someone"} accepted "${invite.proposed_title}"`,
      data: { invite_id: inviteId },
    });

    revalidatePath("/calendar");
    return { success: true };

  } else if (action === "decline") {
    await supabase.from("event_invites").update({ status: "declined" }).eq("id", inviteId);

    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
    await supabase.from("notifications").insert({
      user_id: invite.organizer_id,
      type: "invite_declined",
      title: "Invite declined",
      message: `${profile?.full_name || "Someone"} declined "${invite.proposed_title}"`,
      data: { invite_id: inviteId },
    });

    return { success: true };

  } else if (action === "counter" && counterData) {
    await supabase.from("event_invites").update({
      status: "negotiating",
      counter_start: counterData.start,
      counter_end: counterData.end,
      counter_message: counterData.message,
      updated_at: new Date().toISOString(),
    }).eq("id", inviteId);

    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
    await supabase.from("notifications").insert({
      user_id: invite.organizer_id,
      type: "counter_proposal",
      title: "New time suggested",
      message: `${profile?.full_name || "Someone"} suggested a different time for "${invite.proposed_title}": ${counterData.message}`,
      data: { invite_id: inviteId, counter_start: counterData.start, counter_end: counterData.end },
    });

    return { success: true };
  }

  return { success: false, error: "Invalid action" };
}

export interface InviteWithMeta {
  id: string;
  organizer_id: string;
  invitee_id: string;
  proposed_title: string;
  proposed_description: string | null;
  proposed_location: string | null;
  proposed_start: string;
  proposed_end: string;
  status: "pending" | "negotiating" | "accepted" | "declined" | "cancelled";
  counter_message: string | null;
  counter_start: string | null;
  counter_end: string | null;
  created_at: string;
  otherName: string;
  otherTimezone: string;
  myTimezone: string;
  isOrganizer: boolean;
}

export async function getMyInvites(): Promise<InviteWithMeta[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("event_invites")
    .select("*")
    .or(`organizer_id.eq.${user.id},invitee_id.eq.${user.id}`)
    .neq("status", "declined")
    .order("created_at", { ascending: false });

  if (!data) return [];

  // Enrich with names and timezone
  const { data: myProfile } = await supabase.from("profiles").select("timezone").eq("id", user.id).single();
  const enriched: InviteWithMeta[] = [];
  for (const inv of data) {
    const otherId = inv.organizer_id === user.id ? inv.invitee_id : inv.organizer_id;
    const { data: profile } = await supabase.from("profiles").select("full_name, timezone").eq("id", otherId).single();
    enriched.push({
      ...inv,
      otherName: profile?.full_name || "User",
      otherTimezone: profile?.timezone || "Europe/Belgrade",
      myTimezone: myProfile?.timezone || "Europe/Belgrade",
      isOrganizer: inv.organizer_id === user.id,
    });
  }

  return enriched;
}

// ---- NOTIFICATIONS ----

export async function getNotifications(): Promise<any[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return data || [];
}

export async function markNotificationRead(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("notifications").update({ read: true }).eq("id", id);
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  return count || 0;
}

// ---- AI HELPER: Find mutual free time ----

export async function findMutualFreeTime(friendId: string, durationMinutes: number = 60, daysAhead: number = 7): Promise<Array<{ start: string; end: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const now = new Date();
  const endRange = new Date(now.getTime() + daysAhead * 86400000);

  // Get both users' events
  const [myEvents, theirEvents] = await Promise.all([
    supabase.from("events").select("start_time, end_time").eq("user_id", user.id)
      .gte("start_time", now.toISOString()).lte("start_time", endRange.toISOString()),
    supabase.from("events").select("start_time, end_time").eq("user_id", friendId)
      .gte("start_time", now.toISOString()).lte("start_time", endRange.toISOString()),
  ]);

  const allBusy = [...(myEvents.data || []), ...(theirEvents.data || [])].map((e) => ({
    start: new Date(e.start_time).getTime(),
    end: new Date(e.end_time).getTime(),
  }));

  // Find free slots during working hours (9-18) for next N days
  const slots: Array<{ start: string; end: string }> = [];

  for (let d = 0; d < daysAhead && slots.length < 5; d++) {
    const day = new Date(now.getTime() + d * 86400000);
    if (day.getDay() === 0 || day.getDay() === 6) continue; // Skip weekends

    for (let h = 9; h <= 18 - durationMinutes / 60; h++) {
      const slotStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, 0).getTime();
      const slotEnd = slotStart + durationMinutes * 60000;

      const hasConflict = allBusy.some((b) => slotStart < b.end && slotEnd > b.start);

      if (!hasConflict) {
        slots.push({
          start: new Date(slotStart).toISOString(),
          end: new Date(slotEnd).toISOString(),
        });
        break; // One slot per day is enough
      }
    }
  }

  return slots;
}
