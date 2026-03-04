export const CHAT_INPUT_ID = "trip-chat-input";

export function focusChatInput() {
  const input = document.getElementById(CHAT_INPUT_ID);

  if (input instanceof HTMLTextAreaElement) {
    input.focus();
  }
}
