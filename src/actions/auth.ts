"use server";

import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { sendEmail, welcomeEmail } from "@/src/lib/email";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/calendar");
}

export async function register(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Fire-and-forget welcome email. If email provider isn't configured this
  // just logs and returns ok — signup is never blocked on this.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://krowna.com";
  sendEmail({ to: email, ...welcomeEmail({ name: fullName, appUrl }) }).catch(() => {});

  redirect("/calendar");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
