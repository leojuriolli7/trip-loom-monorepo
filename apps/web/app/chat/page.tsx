import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/api/server-session";

import { WelcomeScreen } from "./_components/welcome-screen/welcome-screen";

export default async function ChatWelcomePage() {
  const session = await getServerSession();

  const userName = session?.user?.name;

  if (!userName) {
    redirect("/enter");
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <WelcomeScreen userName={userName.split(" ")[0]} />
    </div>
  );
}
