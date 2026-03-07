import { NewChatInputPanel } from "./new-chat-input-panel";
import { WelcomeScreen } from "./welcome-screen/welcome-screen";

export function ChatPage() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
        <WelcomeScreen />
      </div>

      <NewChatInputPanel />
    </div>
  );
}
