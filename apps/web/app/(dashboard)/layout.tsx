import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@trip-loom/api/auth";
import { UserPreferencesDialog } from "@/components/user-preferences-dialog";

export default async function DashboardLayout({
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
      {children}
    </>
  );
}
