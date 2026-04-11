import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { LandingPage } from "@/src/components/layout/LandingPage";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/calendar");
  }

  return <LandingPage />;
}
