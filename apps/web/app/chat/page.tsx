import { redirect } from "next/navigation";
import { ChatPage } from "@/components/chat-page";
import { getServerSession } from "@/lib/api/server-session";

export default async function ChatWelcomePage() {
  const session = await getServerSession();

  const userName = session?.user?.name;

  if (!userName) {
    redirect("/enter");
  }

  return <ChatPage userName={userName.split(" ")[0]} />;
}
