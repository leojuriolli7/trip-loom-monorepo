import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@trip-loom/api/auth";

export default async function EnterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/chat");
  }

  return <>{children}</>;
}
