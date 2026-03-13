import { getServerSession } from "@/lib/api/server-session";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing-page";

export default async function RootPage() {
  const session = await getServerSession();
  const { user } = session || {};

  if (!!user) {
    redirect("/chat");
  }

  return <LandingPage />;
}
