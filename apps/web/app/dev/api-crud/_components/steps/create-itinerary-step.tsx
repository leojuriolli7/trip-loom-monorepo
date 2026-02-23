"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, addDays, differenceInDays } from "date-fns";
import type {
  CreateItineraryInput,
  ItineraryDetailDTO,
} from "@trip-loom/api/dto";
import { PlusIcon, TrashIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { itineraryQueries } from "@/lib/api/react-query/itineraries";
import { useWizard } from "../wizard-context";

type Activity = {
  id: string;
  orderIndex: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
};

type Day = {
  id: string;
  dayNumber: number;
  date: string;
  title: string;
  notes: string;
  activities: Activity[];
};

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function CreateItineraryStep() {
  const { trip, destination, setItinerary, nextStep } = useWizard();

  const [days, setDays] = React.useState<Day[]>(() => {
    if (!trip?.startDate || !trip?.endDate) return [];

    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const numDays = differenceInDays(end, start) + 1;

    return Array.from({ length: Math.min(numDays, 7) }, (_, i) => ({
      id: generateId(),
      dayNumber: i + 1,
      date: format(addDays(start, i), "yyyy-MM-dd"),
      title: `Day ${i + 1}`,
      notes: "",
      activities: [
        {
          id: generateId(),
          orderIndex: 0,
          title: "",
          description: "",
          startTime: "09:00",
          endTime: "10:00",
          location: "",
        },
      ],
    }));
  });

  const createItineraryMutation = useMutation(
    itineraryQueries.createTripItinerary(),
  );

  const addDay = () => {
    const lastDay = days[days.length - 1];
    const newDate = lastDay
      ? format(addDays(new Date(lastDay.date), 1), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd");

    setDays((prev) => [
      ...prev,
      {
        id: generateId(),
        dayNumber: prev.length + 1,
        date: newDate,
        title: `Day ${prev.length + 1}`,
        notes: "",
        activities: [
          {
            id: generateId(),
            orderIndex: 0,
            title: "",
            description: "",
            startTime: "09:00",
            endTime: "10:00",
            location: "",
          },
        ],
      },
    ]);
  };

  const removeDay = (dayId: string) => {
    setDays((prev) =>
      prev
        .filter((d) => d.id !== dayId)
        .map((d, i) => ({ ...d, dayNumber: i + 1 })),
    );
  };

  const updateDay = (dayId: string, field: keyof Day, value: string) => {
    setDays((prev) =>
      prev.map((d) => (d.id === dayId ? { ...d, [field]: value } : d)),
    );
  };

  const addActivity = (dayId: string) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d;
        return {
          ...d,
          activities: [
            ...d.activities,
            {
              id: generateId(),
              orderIndex: d.activities.length,
              title: "",
              description: "",
              startTime: "09:00",
              endTime: "10:00",
              location: "",
            },
          ],
        };
      }),
    );
  };

  const removeActivity = (dayId: string, activityId: string) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d;
        return {
          ...d,
          activities: d.activities
            .filter((a) => a.id !== activityId)
            .map((a, i) => ({ ...a, orderIndex: i })),
        };
      }),
    );
  };

  const updateActivity = (
    dayId: string,
    activityId: string,
    field: keyof Activity,
    value: string | number,
  ) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d;
        return {
          ...d,
          activities: d.activities.map((a) =>
            a.id === activityId ? { ...a, [field]: value } : a,
          ),
        };
      }),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!trip) {
      toast.error("Missing trip data");
      return;
    }

    // Filter out empty activities and days
    const validDays = days
      .map((day) => ({
        dayNumber: day.dayNumber,
        date: day.date,
        title: day.title || undefined,
        notes: day.notes || undefined,
        activities: day.activities
          .filter((a) => a.title.trim())
          .map((a) => ({
            orderIndex: a.orderIndex,
            title: a.title,
            description: a.description || undefined,
            startTime: a.startTime || undefined,
            endTime: a.endTime || undefined,
            location: a.location || undefined,
          })),
      }))
      .filter((day) => day.activities.length > 0 || day.title || day.notes);

    const input: CreateItineraryInput = {
      days: validDays,
    };

    createItineraryMutation
      .mutateAsync({
        tripId: trip.id,
        body: input,
      })
      .then((result) => {
        if (result.error || !result.data) {
          toast.error("Failed to create itinerary");
          return;
        }

        const itinerary = result.data as ItineraryDetailDTO;
        setItinerary(itinerary);
        toast.success("Itinerary created!");
        nextStep();
      })
      .catch(() => {
        toast.error("Failed to create itinerary");
      });
  };

  const handleSkip = () => {
    nextStep();
  };

  if (!trip) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Missing trip data.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Itinerary</CardTitle>
        <CardDescription>
          Plan your daily activities in{" "}
          {destination?.name ?? "your destination"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {days.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p>No days added yet.</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addDay}
                  className="mt-4"
                >
                  <PlusIcon className="mr-2 size-4" />
                  Add First Day
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {days.map((day) => (
                  <div
                    key={day.id}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            Day {day.dayNumber}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(day.date), "EEE, MMM d")}
                          </span>
                        </div>
                        <Input
                          value={day.title}
                          onChange={(e) =>
                            updateDay(day.id, "title", e.target.value)
                          }
                          placeholder="Day title (optional)"
                          className="mb-2"
                        />
                        <Textarea
                          value={day.notes}
                          onChange={(e) =>
                            updateDay(day.id, "notes", e.target.value)
                          }
                          placeholder="Notes for this day..."
                          className="min-h-16"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeDay(day.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <TrashIcon className="size-4" />
                      </Button>
                    </div>

                    <div className="space-y-3 ml-4 border-l-2 border-border pl-4">
                      {day.activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 rounded-lg bg-muted/30 p-3"
                        >
                          <div className="flex-1 space-y-2">
                            <Input
                              value={activity.title}
                              onChange={(e) =>
                                updateActivity(
                                  day.id,
                                  activity.id,
                                  "title",
                                  e.target.value,
                                )
                              }
                              placeholder="Activity title"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                type="time"
                                value={activity.startTime}
                                onChange={(e) =>
                                  updateActivity(
                                    day.id,
                                    activity.id,
                                    "startTime",
                                    e.target.value,
                                  )
                                }
                                placeholder="Start time"
                              />
                              <Input
                                type="time"
                                value={activity.endTime}
                                onChange={(e) =>
                                  updateActivity(
                                    day.id,
                                    activity.id,
                                    "endTime",
                                    e.target.value,
                                  )
                                }
                                placeholder="End time"
                              />
                            </div>
                            <Input
                              value={activity.location}
                              onChange={(e) =>
                                updateActivity(
                                  day.id,
                                  activity.id,
                                  "location",
                                  e.target.value,
                                )
                              }
                              placeholder="Location"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeActivity(day.id, activity.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <TrashIcon className="size-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addActivity(day.id)}
                        className="text-muted-foreground"
                      >
                        <PlusIcon className="mr-1 size-4" />
                        Add Activity
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {days.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={addDay}
                className="w-full"
              >
                <PlusIcon className="mr-2 size-4" />
                Add Day
              </Button>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                className="flex-1"
              >
                Skip Itinerary
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createItineraryMutation.isPending}
              >
                {createItineraryMutation.isPending ? (
                  <>
                    <Spinner />
                    Creating...
                  </>
                ) : (
                  "Create Itinerary"
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
