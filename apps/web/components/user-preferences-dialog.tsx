"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  cabinClassValues,
  budgetRangeValues,
  travelInterestValues,
  regionValues,
  CabinClass,
  BudgetRange,
} from "@trip-loom/api/enums";
import type { UserPreferenceDTO } from "@trip-loom/api/dto";

import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
  FieldDescription,
} from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { XIcon, CheckIcon } from "lucide-react";
import { userPreferencesQueries } from "@/lib/api/react-query/user-preferences";
import { atom, useAtom } from "jotai";

export const userPreferencesDialogOpenAtom = atom(false);

const CABIN_CLASS_LABELS: Record<CabinClass, string> = {
  economy: "Economy",
  business: "Business",
  first: "First Class",
};

const BUDGET_RANGE_LABELS: Record<BudgetRange, string> = {
  budget: "Budget-Friendly",
  moderate: "Moderate",
  upscale: "Upscale",
  luxury: "Luxury",
};

export function UserPreferencesDialog() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [dialogOpen, setDialogOpen] = useAtom(userPreferencesDialogOpenAtom);

  const onOpenChange = (val: boolean) => {
    setDialogOpen(val);
  };

  if (isDesktop === undefined) {
    return null;
  }

  if (isDesktop) {
    return (
      <Dialog open={dialogOpen} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-h-[85vh] overflow-y-auto no-scrollbar sm:max-w-lg"
          data-testid="preferences-dialog"
        >
          <DialogHeader>
            <DialogTitle>Travel Preferences</DialogTitle>
            <DialogDescription>
              Help us personalize your travel recommendations. Your preferences
              help our AI suggest destinations, hotels, and itineraries tailored
              to you.
            </DialogDescription>
          </DialogHeader>
          <PreferencesFormWrapper onSuccess={() => onOpenChange(false)} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={dialogOpen} onOpenChange={onOpenChange}>
      <DrawerContent data-testid="preferences-drawer">
        <DrawerHeader className="text-left">
          <DrawerTitle>Travel Preferences</DrawerTitle>
          <DrawerDescription>
            Help us personalize your travel recommendations.
          </DrawerDescription>
        </DrawerHeader>
        <div className="max-h-[60vh] overflow-y-auto px-4">
          <PreferencesFormWrapper onSuccess={() => onOpenChange(false)} />
        </div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function PreferencesFormWrapper({ onSuccess }: { onSuccess: () => void }) {
  const { data, isPending, isError } = useQuery(
    userPreferencesQueries.getUserPreferences(),
  );

  if (isPending) {
    return (
      <div
        className="flex min-h-75 items-center justify-center"
        data-testid="preferences-loading"
      >
        <Spinner className="size-8" />
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="flex min-h-75 flex-col items-center justify-center gap-2 text-center">
        <p className="text-destructive">Failed to load preferences</p>
        <p className="text-sm text-muted-foreground">Please try again later</p>
      </div>
    );
  }

  return <PreferencesForm initialData={data.data} onSuccess={onSuccess} />;
}

function PreferencesForm({
  initialData,
  onSuccess,
}: {
  initialData: UserPreferenceDTO;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const [dietaryInput, setDietaryInput] = React.useState("");

  const form = useForm<UserPreferenceDTO>({
    defaultValues: {
      preferredCabinClass: initialData.preferredCabinClass,
      budgetRange: initialData.budgetRange,
      travelInterests: initialData.travelInterests,
      preferredRegions: initialData.preferredRegions,
      dietaryRestrictions: initialData.dietaryRestrictions,
      accessibilityNeeds: initialData.accessibilityNeeds,
    },
  });

  const mutation = useMutation(userPreferencesQueries.putUserPreferences());

  const onSubmit = async (data: UserPreferenceDTO) => {
    try {
      const result = await mutation.mutateAsync({
        preferredCabinClass: data.preferredCabinClass,
        budgetRange: data.budgetRange,
        travelInterests: data.travelInterests,
        preferredRegions: data.preferredRegions,
        dietaryRestrictions: data.dietaryRestrictions,
        accessibilityNeeds: data.accessibilityNeeds,
      });

      queryClient.setQueryData(
        userPreferencesQueries.getUserPreferences().queryKey,
        result,
      );
      toast.success("Preferences saved successfully!");
      onSuccess();
    } catch {
      toast.error("Failed to save preferences. Please try again.");
    }
  };

  const handleDietaryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && dietaryInput.trim()) {
      e.preventDefault();
      const current = form.getValues("dietaryRestrictions");
      if (!current.includes(dietaryInput.trim())) {
        form.setValue("dietaryRestrictions", [...current, dietaryInput.trim()]);
      }
      setDietaryInput("");
    }
  };

  const removeDietaryRestriction = (restriction: string) => {
    const current = form.getValues("dietaryRestrictions");
    form.setValue(
      "dietaryRestrictions",
      current.filter((r) => r !== restriction),
    );
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Controller
          name="preferredCabinClass"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="cabin-class">
                Preferred Cabin Class
              </FieldLabel>
              <Select
                value={field.value ?? "none"}
                onValueChange={(value) =>
                  field.onChange(value === "none" ? null : value)
                }
              >
                <SelectTrigger
                  id="cabin-class"
                  className="w-full"
                  data-testid="cabin-class-select"
                >
                  <SelectValue placeholder="No preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No preference</SelectItem>
                  {cabinClassValues.map((cabin) => (
                    <SelectItem key={cabin} value={cabin}>
                      {CABIN_CLASS_LABELS[cabin]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="budgetRange"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="budget-range">Budget Range</FieldLabel>
              <Select
                value={field.value ?? "none"}
                onValueChange={(value) =>
                  field.onChange(value === "none" ? null : value)
                }
              >
                <SelectTrigger
                  id="budget-range"
                  className="w-full"
                  data-testid="budget-range-select"
                >
                  <SelectValue placeholder="No preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No preference</SelectItem>
                  {budgetRangeValues.map((range) => (
                    <SelectItem key={range} value={range}>
                      {BUDGET_RANGE_LABELS[range]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="travelInterests"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Travel Interests</FieldLabel>
              <FieldDescription>Select all that apply to you</FieldDescription>
              <div
                className="flex flex-wrap gap-2"
                data-testid="travel-interests"
              >
                {travelInterestValues.map((interest) => {
                  const isSelected = field.value.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          field.onChange(
                            field.value.filter((i) => i !== interest),
                          );
                        } else {
                          field.onChange([...field.value, interest]);
                        }
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                      )}
                      data-testid={`interest-${interest}`}
                    >
                      {isSelected && <CheckIcon className="size-3.5" />}
                      <span className="capitalize">{interest}</span>
                    </button>
                  );
                })}
              </div>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="preferredRegions"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Preferred Regions</FieldLabel>
              <FieldDescription>
                Where would you like to travel?
              </FieldDescription>
              <div
                className="flex flex-wrap gap-2"
                data-testid="preferred-regions"
              >
                {regionValues.map((region) => {
                  const isSelected = field.value.includes(region);
                  return (
                    <button
                      key={region}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          field.onChange(
                            field.value.filter((r) => r !== region),
                          );
                        } else {
                          field.onChange([...field.value, region]);
                        }
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                      )}
                      data-testid={`region-${region.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {isSelected && <CheckIcon className="size-3.5" />}
                      {region}
                    </button>
                  );
                })}
              </div>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="dietaryRestrictions"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="dietary-restrictions">
                Dietary Restrictions
              </FieldLabel>
              <FieldDescription>
                Type and press Enter to add (e.g., vegetarian, gluten-free)
              </FieldDescription>
              <input
                id="dietary-restrictions"
                type="text"
                value={dietaryInput}
                onChange={(e) => setDietaryInput(e.target.value)}
                onKeyDown={handleDietaryKeyDown}
                placeholder="Add a dietary restriction..."
                className="border-input bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-xl border px-3 text-sm outline-none transition-colors focus-visible:ring-[3px]"
                data-testid="dietary-input"
              />
              {field.value.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {field.value.map((restriction) => (
                    <Badge
                      key={restriction}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {restriction}
                      <button
                        type="button"
                        onClick={() => removeDietaryRestriction(restriction)}
                        className="ml-1 rounded-full p-0.5 hover:bg-muted"
                        data-testid={`remove-dietary-${restriction}`}
                      >
                        <XIcon className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="accessibilityNeeds"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="accessibility-needs">
                Accessibility Needs
              </FieldLabel>
              <FieldDescription>
                Let us know if you have any accessibility requirements
              </FieldDescription>
              <Textarea
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value || null)}
                id="accessibility-needs"
                placeholder="E.g., wheelchair accessible rooms, visual aids, etc."
                className="min-h-20"
                data-testid="accessibility-textarea"
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={mutation.isPending}
          data-testid="save-preferences-button"
        >
          {mutation.isPending ? (
            <>
              <Spinner />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}
