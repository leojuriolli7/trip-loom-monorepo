import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@trip-loom/api/auth";
import { UserPreferencesDialog } from "@/components/user-preferences-dialog";

import { ChatShellLayout } from "./_components/shell/chat-shell-layout";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

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
