export const CHAT_INPUT_ID = "trip-chat-input";
export const PROMPT_BLOCK_ID = "trip-chat-input-prompt-block";

export function focusChatInput() {
  const input = document.getElementById(CHAT_INPUT_ID);

  if (input instanceof HTMLTextAreaElement) {
    input.focus();
  }
}

export function focusPromptBlock() {
  const promptBlockInput = document.querySelector(`#${PROMPT_BLOCK_ID} input`);

  if (promptBlockInput instanceof HTMLInputElement) {
    promptBlockInput.focus();
  }
}
