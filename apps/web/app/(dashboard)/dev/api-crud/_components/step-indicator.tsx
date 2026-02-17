"use client";

import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";
import { useWizard, STEPS, getStepIndex, getStepLabel } from "./wizard-context";

export function StepIndicator() {
  const { currentStep } = useWizard();
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="flex items-center justify-center gap-1">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step} className="flex items-center">
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-xs font-medium transition-colors",
                isCompleted && "bg-primary text-primary-foreground",
                isCurrent && "bg-primary/20 text-primary ring-2 ring-primary",
                !isCompleted && !isCurrent && "bg-muted text-muted-foreground",
              )}
              title={getStepLabel(step)}
            >
              {isCompleted ? (
                <CheckIcon className="size-4" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-4 transition-colors",
                  index < currentIndex ? "bg-primary" : "bg-muted",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
