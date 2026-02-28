import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@trip-loom/api/auth";

import { WelcomeScreen } from "./_components/welcome-screen/welcome-screen";

export default async function ChatWelcomePage() {
  const sessionResult = await auth.api.getSession({
    headers: await headers(),
  });

  const userName = sessionResult?.user?.name;

  if (!userName) {
    redirect("/enter");
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <WelcomeScreen userName={userName.split(" ")[0]} />
    </div>
  );
}
