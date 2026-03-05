"use client";

import * as React from "react";
import Image from "next/image";
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
} from "@trip-loom/contracts/enums";
import type { UserPreferenceDTO } from "@trip-loom/contracts/dto";

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
import { XIcon } from "lucide-react";
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

type PreferencesSectionCardProps = {
  iconSrc: string;
  iconAlt: string;
  label: string;
  description: string;
  htmlFor?: string;
  invalid?: boolean;
  children: React.ReactNode;
};

function PreferencesSectionCard({
  iconSrc,
  iconAlt,
  label,
  description,
  htmlFor,
  invalid,
  children,
}: PreferencesSectionCardProps) {
  return (
    <Field
      data-invalid={invalid}
      className="relative overflow-hidden rounded-[1.65rem] p-4"
    >
      <div className="relative space-y-3">
        <div className="flex items-start gap-3.5">
          <div className="relative mt-0.5 shrink-0">
            <div className="relative flex items-center justify-center rounded-full">
              <Image
                src={iconSrc}
                alt={iconAlt}
                width={96}
                height={96}
                className="h-24 w-24 object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.2)]"
              />
            </div>
          </div>

          <div className="space-y-1 mt-3">
            <FieldLabel className="text-lg" htmlFor={htmlFor}>
              {label}
            </FieldLabel>
            <FieldDescription className="text-md">
              {description}
            </FieldDescription>
          </div>
        </div>

        {children}
      </div>
    </Field>
  );
}

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
          className="max-h-[90dvh] overflow-hidden p-0 sm:max-w-2xl"
          data-testid="preferences-dialog"
        >
          <div className="relative h-full">
            <div className="max-h-[90dvh] overflow-y-auto no-scrollbar px-5 pt-5 pb-6 sm:px-6">
              <DialogHeader className="gap-3 pb-2">
                <div className="flex items-start justify-between gap-4 pr-10">
                  <div className="space-y-1.5">
                    <DialogTitle className="text-2xl font-semibold tracking-tight">
                      Travel Preferences
                    </DialogTitle>
                    <DialogDescription className="text-sm leading-relaxed">
                      Help us personalize your travel recommendations. Your
                      choices guide flights, destinations, hotels, and itinerary
                      suggestions.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <PreferencesFormWrapper onSuccess={() => onOpenChange(false)} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={dialogOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="p-0" data-testid="preferences-drawer">
        <div className="relative">
          <DrawerHeader className="px-5 pt-5 pb-1 text-left">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DrawerTitle className="text-left text-xl font-semibold tracking-tight">
                  Travel Preferences
                </DrawerTitle>
                <DrawerDescription className="text-left text-sm leading-relaxed">
                  Help us personalize your recommendations.
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>

          <div className="max-h-[66dvh] overflow-y-auto no-scrollbar px-4 pb-2">
            <PreferencesFormWrapper onSuccess={() => onOpenChange(false)} />
          </div>
        </div>

        <DrawerFooter className="pt-3" />
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
        className="mt-4 flex min-h-75 items-center justify-center rounded-3xl border border-border/60 bg-background/70"
        data-testid="preferences-loading"
      >
        <Spinner className="size-8" />
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="mt-4 flex min-h-75 flex-col items-center justify-center gap-2 rounded-3xl border border-border/60 bg-background/70 text-center">
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="pt-4">
      <FieldGroup className="gap-4">
        <Controller
          name="preferredCabinClass"
          control={form.control}
          render={({ field, fieldState }) => (
            <PreferencesSectionCard
              iconSrc="/plane-seat-3.png"
              iconAlt="3D plane seat icon"
              invalid={fieldState.invalid}
              htmlFor="cabin-class"
              label="Preferred Cabin Class"
              description="Choose the seat comfort level you usually book."
            >
              <Select
                value={field.value ?? "none"}
                onValueChange={(value) =>
                  field.onChange(value === "none" ? null : value)
                }
              >
                <SelectTrigger
                  id="cabin-class"
                  className="h-10 w-full rounded-2xl border-border/70 bg-background/90"
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
            </PreferencesSectionCard>
          )}
        />

        <Controller
          name="budgetRange"
          control={form.control}
          render={({ field, fieldState }) => (
            <PreferencesSectionCard
              iconSrc="/wallet.png"
              iconAlt="Wallet with dollar bills coming out of it"
              invalid={fieldState.invalid}
              htmlFor="budget-range"
              label="Budget Range"
              description="Keep destination and stay options aligned with your expected spend."
            >
              <Select
                value={field.value ?? "none"}
                onValueChange={(value) =>
                  field.onChange(value === "none" ? null : value)
                }
              >
                <SelectTrigger
                  id="budget-range"
                  className="h-10 w-full rounded-2xl border-border/70 bg-background/90"
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
            </PreferencesSectionCard>
          )}
        />

        <Controller
          name="travelInterests"
          control={form.control}
          render={({ field, fieldState }) => (
            <PreferencesSectionCard
              iconSrc="/eiffel-golden.png"
              iconAlt="Eiffel tower"
              invalid={fieldState.invalid}
              label="Travel Interests"
              description="Select all that apply to you"
            >
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
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200",
                        isSelected
                          ? "border-primary/55 bg-primary/15 text-primary shadow-[0_10px_20px_-16px_rgba(208,115,48,0.8)]"
                          : "border-border/80 bg-background text-muted-foreground hover:border-primary/50 hover:bg-secondary/55 hover:text-foreground",
                      )}
                      data-testid={`interest-${interest}`}
                    >
                      <span className="capitalize">{interest}</span>
                    </button>
                  );
                })}
              </div>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </PreferencesSectionCard>
          )}
        />

        <Controller
          name="preferredRegions"
          control={form.control}
          render={({ field, fieldState }) => (
            <PreferencesSectionCard
              iconSrc="/map-and-compass.png"
              iconAlt="3D map and compass icon"
              invalid={fieldState.invalid}
              label="Preferred Regions"
              description="Where would you like to travel?"
            >
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
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200",
                        isSelected
                          ? "border-primary/55 bg-primary/15 text-primary shadow-[0_10px_20px_-16px_rgba(208,115,48,0.8)]"
                          : "border-border/80 bg-background text-muted-foreground hover:border-primary/50 hover:bg-secondary/55 hover:text-foreground",
                      )}
                      data-testid={`region-${region.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {region}
                    </button>
                  );
                })}
              </div>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </PreferencesSectionCard>
          )}
        />

        <Controller
          name="dietaryRestrictions"
          control={form.control}
          render={({ field, fieldState }) => (
            <PreferencesSectionCard
              iconSrc="/dish.png"
              iconAlt="A dish plate with an egg, bananas and grapes"
              invalid={fieldState.invalid}
              htmlFor="dietary-restrictions"
              label="Dietary Restrictions"
              description="Type and press Enter to add (e.g., vegetarian, gluten-free)"
            >
              <input
                id="dietary-restrictions"
                type="text"
                value={dietaryInput}
                onChange={(e) => setDietaryInput(e.target.value)}
                onKeyDown={handleDietaryKeyDown}
                placeholder="Add a dietary restriction..."
                className="border-input bg-input/20 focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-2xl border px-3 text-sm outline-none transition-colors focus-visible:ring-[3px]"
                data-testid="dietary-input"
              />
              {field.value.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {field.value.map((restriction) => (
                    <Badge
                      key={restriction}
                      variant="secondary"
                      className="gap-1 border border-border/60 bg-secondary/65 p-4 text-md"
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
            </PreferencesSectionCard>
          )}
        />

        <Controller
          name="accessibilityNeeds"
          control={form.control}
          render={({ field, fieldState }) => (
            <PreferencesSectionCard
              iconSrc="/wheelchair.png"
              iconAlt="Blue wheelchair"
              invalid={fieldState.invalid}
              htmlFor="accessibility-needs"
              label="Accessibility Needs"
              description="Let us know if you have any accessibility requirements"
            >
              <Textarea
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value || null)}
                id="accessibility-needs"
                placeholder="E.g., wheelchair accessible rooms, visual aids, etc."
                className="min-h-24 rounded-2xl border-border/70 bg-input/20"
                data-testid="accessibility-textarea"
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </PreferencesSectionCard>
          )}
        />

        <Button
          type="submit"
          className="mt-1 h-10 w-full rounded-3xl shadow-[0_20px_30px_-24px_rgba(208,115,48,0.7)]"
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
