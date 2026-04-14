import { Sidebar } from "@/src/components/layout/Sidebar";
import { Header } from "@/src/components/layout/Header";
import { AskAIDialog } from "@/src/components/ai/AskAIDialog";
import { MobileDrawer } from "@/src/components/layout/MobileDrawer";
import { OnboardingTour } from "@/src/components/onboarding/OnboardingTour";
import { NotificationManager } from "@/src/components/NotificationManager";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full">
      <div className="hidden lg:flex">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <AskAIDialog />
      <MobileDrawer />
      <OnboardingTour />
      <NotificationManager />
    </div>
  );
}
