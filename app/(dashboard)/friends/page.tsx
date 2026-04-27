"use client";

import { useState, useEffect } from "react";
import { getFriends, getPendingRequests, sendFriendRequest, respondToFriendRequest, type FriendProfile } from "@/src/actions/social";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, UserPlus, Check, X, MapPin, Briefcase, Cake, ArrowLeft, Search, Quote, User } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

function getDiceBearUrl(preset: string) {
  if (!preset || !preset.includes(":")) return null;
  const [style, seed] = preset.split(":");
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&size=96`;
}

function FriendAvatar({ friend, size = "md" }: { friend: FriendProfile; size?: "sm" | "md" | "lg" }) {
  const src = friend.avatar_url || (friend.avatar_preset ? getDiceBearUrl(friend.avatar_preset) : null);
  const sizes = { sm: "h-8 w-8", md: "h-12 w-12", lg: "h-16 w-16" };
  const textSizes = { sm: "text-xs", md: "text-base", lg: "text-xl" };

  return (
    <div className={cn("rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-border/30 bg-muted/15", sizes[size])}>
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className={cn("font-bold text-primary/40", textSizes[size])}>
          {(friend.display_name || friend.name)?.[0]?.toUpperCase() || "?"}
        </span>
      )}
    </div>
  );
}

function getBirthdayLabel(dob: string | null): string | null {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const thisYearBday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  const diffDays = Math.round((thisYearBday.getTime() - today.getTime()) / 86400000);

  if (diffDays === 0) return "Birthday today!";
  if (diffDays === 1) return "Birthday tomorrow!";
  if (diffDays > 1 && diffDays <= 7) return `Birthday in ${diffDays} days`;
  if (diffDays < 0) {
    const nextYear = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate());
    const daysUntil = Math.round((nextYear.getTime() - today.getTime()) / 86400000);
    if (daysUntil <= 7) return `Birthday in ${daysUntil} days`;
  }
  return null;
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [pending, setPending] = useState<Array<{ id: string; fromName: string; fromId: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([getFriends(), getPendingRequests()]).then(([f, p]) => {
      setFriends(f);
      setPending(p);
      setLoading(false);
    });
  }, []);

  async function handleSend() {
    if (!email.trim()) return;
    setSending(true);
    setError(null);
    setSuccess(false);
    const res = await sendFriendRequest(email.trim());
    if (res.success) {
      setSuccess(true);
      setEmail("");
      toast.success("Friend request sent");
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(res.error || "Failed");
      toast.error(res.error || "Failed to send request");
    }
    setSending(false);
  }

  async function handleAccept(id: string) {
    const res = await respondToFriendRequest(id, true);
    if (!res.success) {
      toast.error(res.error || "Could not accept request");
      return;
    }
    setPending((p) => p.filter((x) => x.id !== id));
    const f = await getFriends();
    setFriends(f);
    toast.success("Friend request accepted");
  }

  async function handleDecline(id: string) {
    const res = await respondToFriendRequest(id, false);
    if (!res.success) {
      toast.error(res.error || "Could not decline request");
      return;
    }
    setPending((p) => p.filter((x) => x.id !== id));
    toast("Request declined");
  }

  const filtered = search
    ? friends.filter((f) =>
        (f.display_name || f.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (f.city || "").toLowerCase().includes(search.toLowerCase()) ||
        (f.occupation || "").toLowerCase().includes(search.toLowerCase())
      )
    : friends;

  const upcomingBirthdays = friends.filter((f) => getBirthdayLabel(f.date_of_birth));

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/calendar" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-3 w-3" />Back to calendar
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Friends</h2>
            <p className="text-sm text-muted-foreground">{friends.length} friend{friends.length !== 1 ? "s" : ""} on Krowna</p>
          </div>
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
            <Users className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>
      </motion.div>

      {/* Add friend */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border/30 bg-card/50 p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" />
          Add a friend
        </h3>
        <div className="flex gap-2">
          <Input
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Enter their email address..."
            className="border-border/30 bg-muted/15"
          />
          <Button onClick={handleSend} disabled={sending || !email.trim()} className="gradient-primary border-0 text-primary-foreground shrink-0">
            {sending ? "Sending..." : <><UserPlus className="mr-1.5 h-3.5 w-3.5" />Add</>}
          </Button>
        </div>
        {error && <p className="text-xs text-destructive mt-2">{error}</p>}
        {success && <p className="text-xs text-green-400 mt-2">Friend request sent!</p>}
      </motion.div>

      {/* Pending requests */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Requests</h3>
          {pending.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4"
            >
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                {r.fromName[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{r.fromName}</span>
                <p className="text-[10px] text-muted-foreground">Wants to connect</p>
              </div>
              <Button size="sm" className="gradient-primary border-0 text-primary-foreground text-xs" onClick={() => handleAccept(r.id)}>
                <Check className="mr-1 h-3 w-3" />Accept
              </Button>
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => handleDecline(r.id)}>
                <X className="h-3 w-3" />
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upcoming birthdays */}
      {upcomingBirthdays.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-pink-500/20 bg-pink-500/5 p-4">
          <h3 className="text-xs font-semibold text-pink-400 mb-2 flex items-center gap-1.5">
            <Cake className="h-3.5 w-3.5" />
            Upcoming Birthdays
          </h3>
          <div className="space-y-2">
            {upcomingBirthdays.map((f) => (
              <div key={f.id} className="flex items-center gap-2.5">
                <FriendAvatar friend={f} size="sm" />
                <span className="text-xs font-medium flex-1">{f.display_name || f.name}</span>
                <span className="text-[10px] text-pink-400 font-medium">{getBirthdayLabel(f.date_of_birth)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Search */}
      {friends.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search friends..."
            className="pl-9 border-border/30 bg-muted/15"
          />
        </div>
      )}

      {/* Friend list */}
      {loading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Loading friends...</div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((friend, i) => (
            <motion.div
              key={friend.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-xl border border-border/30 bg-card/50 p-4 hover:bg-card/70 transition-colors"
            >
              <div className="flex items-start gap-4">
                <FriendAvatar friend={friend} size="lg" />
                <div className="flex-1 min-w-0 space-y-1">
                  <div>
                    <h4 className="text-sm font-semibold">{friend.display_name || friend.name}</h4>
                    {friend.display_name && friend.display_name !== friend.name && (
                      <span className="text-[10px] text-muted-foreground/50">{friend.name}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground/70">
                    {friend.occupation && (
                      <span className="flex items-center gap-1"><Briefcase className="h-2.5 w-2.5" />{friend.occupation}</span>
                    )}
                    {friend.city && (
                      <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{friend.city}</span>
                    )}
                    {friend.date_of_birth && (
                      <span className="flex items-center gap-1">
                        <Cake className="h-2.5 w-2.5" />
                        {new Date(friend.date_of_birth).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>

                  {friend.motto && (
                    <p className="text-[10px] text-muted-foreground/50 italic flex items-center gap-1">
                      <Quote className="h-2 w-2 shrink-0" />
                      {friend.motto}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : friends.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/20 mb-3" />
          <p className="text-sm text-muted-foreground/60">No friends yet</p>
          <p className="text-xs text-muted-foreground/40 mt-1">Add friends by email to schedule together</p>
        </div>
      ) : (
        <div className="text-center py-8 text-xs text-muted-foreground/50">No results for &ldquo;{search}&rdquo;</div>
      )}
    </div>
  );
}
