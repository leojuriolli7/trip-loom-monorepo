import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/api/server-session";

export default async function EnterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (session) {
    redirect("/chat");
  }

  return <>{children}</>;
}
