"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, ArrowRight, MapPin, Sparkles } from "lucide-react";
import { getUserProfile, type UserProfile } from "@/src/actions/profile";
import { cn } from "@/lib/utils";

function getDiceBearUrl(preset: string) {
  if (!preset || !preset.includes(":")) return null;
  const [style, seed] = preset.split(":");
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&size=64`;
}

export function ProfilePanel() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    getUserProfile().then(setProfile);
  }, []);

  const hasProfile = profile?.onboarding_completed && (profile.goals.length > 0 || profile.occupation || profile.display_name);
  const avatarSrc = profile?.avatar_url || (profile?.avatar_preset ? getDiceBearUrl(profile.avatar_preset) : null);

  if (!hasProfile) {
    return (
      <Link
        href="/profile"
        className="flex items-center gap-2.5 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3 hover:bg-primary/10 transition-colors"
      >
        <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
          <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-primary">Set up your profile</p>
          <p className="text-[9px] text-muted-foreground">Get personalized AI schedules</p>
        </div>
        <ArrowRight className="h-3 w-3 text-primary/50 shrink-0" />
      </Link>
    );
  }

  return (
    <Link
      href="/profile"
      className="flex items-center gap-2.5 rounded-xl border border-border/30 bg-card/50 p-2.5 hover:bg-card/70 transition-colors group"
    >
      {/* Avatar */}
      <div className="h-9 w-9 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-border/30 bg-muted/15">
        {avatarSrc ? (
          <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm font-bold text-primary/40">
            {(profile?.display_name || profile?.occupation || "U")[0]?.toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold truncate">{profile?.display_name || profile?.occupation || "My Profile"}</p>
        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/60">
          {profile?.city && (
            <span className="flex items-center gap-0.5 truncate"><MapPin className="h-2 w-2 shrink-0" />{profile.city}</span>
          )}
          {profile?.goals && profile.goals.length > 0 && (
            <span>{profile.goals.length} goal{profile.goals.length !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>

      <ArrowRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
    </Link>
  );
}
