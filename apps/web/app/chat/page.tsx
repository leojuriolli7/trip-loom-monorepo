import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/api/server-session";

import { NewChatInputPanel } from "./_components/new-chat-input-panel";
import { WelcomeScreen } from "./_components/welcome-screen/welcome-screen";

export default async function ChatWelcomePage() {
  const session = await getServerSession();

  const userName = session?.user?.name;

  if (!userName) {
    redirect("/enter");
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
        <WelcomeScreen userName={userName.split(" ")[0]} />
      </div>
      <NewChatInputPanel />
    </div>
  );
}
