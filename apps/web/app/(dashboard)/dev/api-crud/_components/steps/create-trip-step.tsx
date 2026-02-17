"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DestinationDTO } from "@trip-loom/api/dto";

import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldDescription,
} from "@/components/ui/field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { tripQueries } from "@/lib/api/react-query/trips";
import { useWizard } from "../wizard-context";
import { InfiniteSearchList } from "../infinite-search-list";

export function CreateTripStep() {
  const { setTrip, setDestination, nextStep } = useWizard();
  const queryClient = useQueryClient();

  const [title, setTitle] = React.useState("");
  const [selectedDestination, setSelectedDestination] =
    React.useState<DestinationDTO | null>(null);
  const [startDate, setStartDate] = React.useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = React.useState<Date | undefined>(undefined);

  const createTripMutation = useMutation(tripQueries.createTrip());

  const isValid =
    selectedDestination !== null &&
    startDate !== undefined &&
    endDate !== undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) return;

    createTripMutation
      .mutateAsync({
        title: title.trim() || null,
        destinationId: selectedDestination.id,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
      })
      .then(async (result) => {
        if (result.error || !result.data) {
          toast.error("Failed to create trip");
          return;
        }

        // Fetch full trip details
        const tripDetail = await queryClient.fetchQuery(
          tripQueries.getTripById(result.data.id),
        );

        if (tripDetail.error || !tripDetail.data) {
          toast.error("Failed to load trip details");
          return;
        }

        setTrip(tripDetail.data);
        setDestination(selectedDestination);
        toast.success("Trip created!");
        nextStep();
      })
      .catch(() => {
        toast.error("Failed to create trip");
      });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a New Trip</CardTitle>
        <CardDescription>
          Start by selecting a destination and your travel dates.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="trip-title">
                Trip Title (Optional)
              </FieldLabel>
              <Input
                id="trip-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Summer vacation in Tokyo"
              />
            </Field>

            <Field>
              <FieldLabel>Destination</FieldLabel>
              <FieldDescription>
                Search and select your destination
              </FieldDescription>
              <InfiniteSearchList<DestinationDTO>
                queryKey={["destinations-search"]}
                queryFn={async ({ search, pageParam }) => {
                  const result = await apiClient.api.destinations.get({
                    query: {
                      search: search || undefined,
                      cursor: pageParam,
                      limit: 10,
                    },
                  });

                  if (!result.data) {
                    throw new Error("Failed to fetch destinations");
                  }

                  return result.data;
                }}
                renderItem={(destination) => (
                  <div>
                    <div className="font-medium">{destination.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {destination.country}
                    </div>
                  </div>
                )}
                getItemId={(d) => d.id}
                selectedId={selectedDestination?.id ?? null}
                onSelect={setSelectedDestination}
                placeholder="Search destinations..."
                emptyMessage="No destinations found"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Start Date</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date);
                        // Auto-set end date if not set or if end date is before new start
                        if (date && (!endDate || endDate < date)) {
                          setEndDate(addDays(date, 7));
                        }
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </Field>

              <Field>
                <FieldLabel>End Date</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) =>
                        date < new Date() ||
                        (startDate ? date < startDate : false)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </Field>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!isValid || createTripMutation.isPending}
            >
              {createTripMutation.isPending ? (
                <>
                  <Spinner />
                  Creating Trip...
                </>
              ) : (
                "Create Trip & Continue"
              )}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
