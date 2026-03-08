"use client";

import type {
  ChangeEvent,
  ComponentProps,
  FormEvent,
  HTMLAttributes,
  KeyboardEventHandler,
  MouseEvent,
} from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { PromptDefinition } from "@trip-loom/contracts/prompts";
import { getPromptArgs, renderPrompt } from "@trip-loom/contracts/prompts";
import {
  InputGroup,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  useOnClearPrompt,
  useOnSetPrompt,
  type SetPromptPayload,
} from "@/lib/prompt-events";
import { PromptBlock } from "./prompt-block";
import { CornerDownLeftIcon, SquareIcon, XIcon } from "lucide-react";

type ChatStatus = "idle" | "streaming" | "submitted" | "error";

// ============================================================================
// Active prompt state
// ============================================================================

type ActivePrompt = {
  definition: PromptDefinition;
  prefilledArgs: Record<string, string>;
};

// ============================================================================
// Context
// ============================================================================

type PromptInputContextValue = {
  setValue: (value: string) => void;
  value: string;
  activePrompt: ActivePrompt | null;
  clearPrompt: () => void;
};

const PromptInputContext = createContext<PromptInputContextValue | null>(null);

const useOptionalPromptInputContext = () => useContext(PromptInputContext);

// ============================================================================
// Types
// ============================================================================

export interface PromptInputMessage {
  text: string;
  files: {
    type: "file";
    filename: string;
    mediaType: string;
    url: string;
  }[];
}

export type PromptInputProps = Omit<
  HTMLAttributes<HTMLFormElement>,
  "onSubmit"
> & {
  onSubmit: (
    message: PromptInputMessage,
    event: FormEvent<HTMLFormElement>,
  ) => void | Promise<void>;
};

// ============================================================================
// PromptInput
// ============================================================================

export const PromptInput = ({
  className,
  onSubmit,
  children,
  ...props
}: PromptInputProps) => {
  const [value, setValue] = useState("");
  const [activePrompt, setActivePrompt] = useState<ActivePrompt | null>(null);
  const [argValues, setArgValues] = useState<Record<string, string>>({});

  const clearPrompt = useCallback(() => {
    setActivePrompt(null);
    setArgValues({});
  }, []);

  const handleSetPrompt = useCallback((payload: SetPromptPayload) => {
    setActivePrompt({
      definition: payload.definition,
      prefilledArgs: payload.prefilledArgs ?? {},
    });

    const initial: Record<string, string> = {};
    for (const arg of getPromptArgs(payload.definition)) {
      if (!arg.required) {
        initial[arg.name] = "";
      }
    }
    setArgValues(initial);
    setValue("");
  }, []);

  useOnSetPrompt(handleSetPrompt);
  useOnClearPrompt(clearPrompt);

  const handleArgChange = useCallback((name: string, newValue: string) => {
    setArgValues((prev) => ({ ...prev, [name]: newValue }));
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const text = activePrompt
        ? renderPrompt(activePrompt.definition, {
            ...activePrompt.prefilledArgs,
            ...argValues,
          })
        : value;

      try {
        await onSubmit({ files: [], text }, event);
        setValue("");
        if (activePrompt) {
          clearPrompt();
        }
      } catch {
        // Preserve the current input value if submission fails.
      }
    },
    [onSubmit, value, activePrompt, argValues, clearPrompt],
  );

  const contextValue = useMemo(
    () => ({ setValue, value, activePrompt, clearPrompt }),
    [setValue, value, activePrompt, clearPrompt],
  );

  return (
    <PromptInputContext.Provider value={contextValue}>
      <form
        className={cn("w-full", className)}
        onSubmit={handleSubmit}
        {...props}
      >
        <InputGroup className="overflow-hidden border-none bg-transparent">
          {activePrompt ? (
            <PromptBlock
              definition={activePrompt.definition}
              prefilledArgs={activePrompt.prefilledArgs}
              argValues={argValues}
              onArgChange={handleArgChange}
              onClear={clearPrompt}
            />
          ) : null}
          {children}
        </InputGroup>
      </form>
    </PromptInputContext.Provider>
  );
};

// ============================================================================
// PromptInputTextarea — hides itself when a prompt is active
// ============================================================================

export type PromptInputTextareaProps = ComponentProps<
  typeof InputGroupTextarea
>;

export const PromptInputTextarea = ({
  onChange,
  onKeyDown,
  className,
  placeholder = "What would you like to know?",
  ...props
}: PromptInputTextareaProps) => {
  const context = useOptionalPromptInputContext();
  const [isComposing, setIsComposing] = useState(false);

  const setValue = context?.setValue;

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setValue?.(event.currentTarget.value);
      onChange?.(event);
    },
    [setValue, onChange],
  );

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      onKeyDown?.(event);

      if (event.defaultPrevented) {
        return;
      }

      if (event.key !== "Enter") {
        return;
      }

      if (isComposing || event.nativeEvent.isComposing || event.shiftKey) {
        return;
      }

      event.preventDefault();

      const submitButton = event.currentTarget.form?.querySelector(
        'button[type="submit"]',
      );
      if (submitButton instanceof HTMLButtonElement && submitButton.disabled) {
        return;
      }

      event.currentTarget.form?.requestSubmit();
    },
    [isComposing, onKeyDown],
  );

  // Hide textarea when a prompt block is active
  if (context?.activePrompt) {
    return null;
  }

  return (
    <InputGroupTextarea
      className={cn("field-sizing-content max-h-48 min-h-16", className)}
      name="message"
      onChange={context ? handleChange : onChange}
      onCompositionEnd={() => setIsComposing(false)}
      onCompositionStart={() => setIsComposing(true)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      value={context?.value}
      {...props}
    />
  );
};

// ============================================================================
// PromptInputSubmit — always visible
// ============================================================================

export type PromptInputSubmitProps = ComponentProps<typeof InputGroupButton> & {
  status?: ChatStatus;
  onStop?: () => void;
};

export const PromptInputSubmit = ({
  className,
  variant = "default",
  size = "icon-sm",
  status,
  onStop,
  onClick,
  children,
  ...props
}: PromptInputSubmitProps) => {
  const isGenerating = status === "submitted" || status === "streaming";

  let icon = <CornerDownLeftIcon className="size-4" />;

  if (status === "submitted") {
    icon = <Spinner />;
  } else if (status === "streaming") {
    icon = <SquareIcon className="size-4" />;
  } else if (status === "error") {
    icon = <XIcon className="size-4" />;
  }

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (isGenerating && onStop) {
        event.preventDefault();
        onStop();
        return;
      }

      onClick?.(event);
    },
    [isGenerating, onClick, onStop],
  );

  return (
    <InputGroupButton
      aria-label={isGenerating ? "Stop" : "Submit"}
      className={cn(className)}
      onClick={handleClick}
      size={size}
      type={isGenerating && onStop ? "button" : "submit"}
      variant={variant}
      {...props}
    >
      {children ?? icon}
    </InputGroupButton>
  );
};
