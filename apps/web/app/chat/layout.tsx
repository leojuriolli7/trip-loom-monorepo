import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/api/server-session";
import { ChatShellLayout } from "@/components/chat-shell-layout";
import { UserPreferencesDialog } from "@/components/user-preferences-dialog";

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
      <ChatShellLayout>{children}</ChatShellLayout>
    </>
  );
}
