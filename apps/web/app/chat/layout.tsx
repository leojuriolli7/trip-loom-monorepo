import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/api/server-session";
import { ChatShellLayout } from "@/components/chat-shell-layout";
import { UserPreferencesDialog } from "@/components/user-preferences-dialog";
import { DestinationDetailDialog } from "@/components/destination-detail-dialog";
import { ItinerarySheet } from "@/components/itinerary-sheet";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/enter");
  }

  return (
    <>
      <UserPreferencesDialog />
      <DestinationDetailDialog />
      <ItinerarySheet />
      <ChatShellLayout>{children}</ChatShellLayout>
    </>
  );
}
