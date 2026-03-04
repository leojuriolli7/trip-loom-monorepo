import { NewChatInputPanel } from "./new-chat-input-panel";
import { WelcomeScreen } from "./welcome-screen/welcome-screen";

interface ChatPageProps {
  userName: string;
}

export function ChatPage({ userName }: ChatPageProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
        <WelcomeScreen userName={userName} />
      </div>
      <NewChatInputPanel />
    </div>
  );
}
