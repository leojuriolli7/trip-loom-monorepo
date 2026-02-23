import { headers } from "next/headers";
import { unauthorized } from "next/navigation";
import { auth } from "@trip-loom/api/auth";

import { WelcomeScreen } from "./_components/welcome-screen/welcome-screen";

export default async function ChatWelcomePage() {
  const sessionResult = await auth.api.getSession({
    headers: await headers(),
  });

  const userName = sessionResult?.user?.name;

  if (!userName) {
    unauthorized();
  }

  return (
    <div className="h-full overflow-y-auto">
      <WelcomeScreen userName={userName.split(" ")[0]} />
    </div>
  );
}
