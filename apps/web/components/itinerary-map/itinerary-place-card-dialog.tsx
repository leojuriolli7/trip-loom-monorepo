"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRightIcon,
  ClockIcon,
  GlobeIcon,
  MapPinIcon,
  PhoneIcon,
  StarIcon,
} from "lucide-react";
import Image from "next/image";
import { googleMapsQueries } from "@/lib/api/react-query/google-maps";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import type { GooglePlaceEnrichedDetails } from "@trip-loom/contracts/dto";

type ItineraryPlaceCardDialogProps = {
  dayId: string;
  placeId: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function PlaceHeroGallery({
  photos,
  displayName,
}: {
  photos: GooglePlaceEnrichedDetails["photos"];
  displayName: string;
}) {
  if (photos.length === 0) return null;

  const heroPhoto = photos[0];
  const sidePhotos = photos.slice(1, 4);

  return (
    <>
      {sidePhotos.length > 0 ? (
        <div
          className="grid grid-cols-3 gap-1.5"
          style={{ height: "clamp(18rem, 32vw, 24rem)" }}
        >
          <div className="col-span-2 min-h-0 overflow-hidden rounded-2xl">
            <img
              src={heroPhoto.url}
              alt={displayName}
              className="h-full w-full object-cover"
              loading="eager"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="grid min-h-0 gap-1.5">
            {sidePhotos.map((photo, index) => (
              <div
                key={`side-${index}`}
                className="min-h-0 overflow-hidden rounded-2xl"
              >
                <img
                  src={photo.url}
                  alt={`${displayName} photo ${index + 2}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-2xl"
          style={{ height: "clamp(18rem, 32vw, 24rem)" }}
        >
          <img
            src={heroPhoto.url}
            alt={displayName}
            className="h-full w-full object-cover"
            loading="eager"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </>
  );
}

function PlaceHeader({
  data,
}: {
  data: GooglePlaceEnrichedDetails;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {data.primaryType ? (
          <Badge variant="secondary" className="capitalize">
            {data.primaryType.replace(/_/g, " ")}
          </Badge>
        ) : null}
        {data.isOpenNow !== null ? (
          <Badge
            variant="outline"
            className={
              data.isOpenNow
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
            }
          >
            <span
              className={`mr-1 inline-block size-1.5 rounded-full ${data.isOpenNow ? "bg-emerald-500" : "bg-red-500"}`}
            />
            {data.isOpenNow ? "Open now" : "Closed"}
          </Badge>
        ) : null}
      </div>

      <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {data.displayName}
      </h2>

      {data.formattedAddress ? (
        <p className="flex items-start gap-2.5 text-[15px] leading-relaxed text-muted-foreground">
          <MapPinIcon className="mt-1 size-4 shrink-0" />
          <span>{data.formattedAddress}</span>
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {data.rating !== null ? (
          <div className="flex items-center gap-1.5">
            <StarIcon className="size-5 fill-chart-1 text-chart-1" />
            <span className="text-lg font-semibold text-foreground">
              {data.rating.toFixed(1)}
            </span>
            {data.userRatingCount !== null ? (
              <span className="text-sm text-muted-foreground">
                ({data.userRatingCount.toLocaleString()} reviews)
              </span>
            ) : null}
          </div>
        ) : null}

        {data.phoneNumber ? (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <PhoneIcon className="size-3.5" />
            <span>{data.phoneNumber}</span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {data.websiteUrl ? (
          <a
            href={data.websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <GlobeIcon className="size-4" />
            Visit website
            <ArrowUpRightIcon className="size-3.5 text-muted-foreground" />
          </a>
        ) : null}

        {data.mapsUrl ? (
          <a
            href={data.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <MapPinIcon className="size-4" />
            Open in Google Maps
            <ArrowUpRightIcon className="size-3.5" />
          </a>
        ) : null}
      </div>
    </div>
  );
}

function PlaceAbout({
  editorialSummary,
  reviewSummary,
}: {
  editorialSummary: string | null;
  reviewSummary: string | null;
}) {
  if (!editorialSummary && !reviewSummary) return null;

  return (
    <div className="space-y-6">
      {editorialSummary ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            About
          </h3>
          <p className="mt-3 text-[15px] leading-[1.8] text-foreground/90">
            {editorialSummary}
          </p>
        </div>
      ) : null}

      {reviewSummary ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            What visitors say
          </h3>
          <p className="mt-3 border-l-2 border-primary/40 pl-4 text-[15px] italic leading-[1.8] text-foreground/80">
            {reviewSummary}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function PlaceOpeningHours({
  weekdayDescriptions,
}: {
  weekdayDescriptions: string[];
}) {
  if (weekdayDescriptions.length === 0) return null;

  return (
    <div>
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        <ClockIcon className="size-3.5" />
        Opening hours
      </h3>
      <div className="mt-4 grid gap-0 divide-y divide-border/60">
        {weekdayDescriptions.map((description) => {
          const [day, ...timeParts] = description.split(":");
          const time = timeParts.join(":").trim();

          return (
            <div
              key={description}
              className="flex items-center justify-between py-2.5"
            >
              <span className="text-sm font-medium text-foreground/90">
                {day}
              </span>
              <span className="text-sm text-muted-foreground">{time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlaceReviews({
  reviews,
  dayId,
  placeId,
}: {
  reviews: GooglePlaceEnrichedDetails["reviews"];
  dayId: string;
  placeId: string;
}) {
  if (reviews.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Reviews
      </h3>
      <div className="mt-4 space-y-5">
        {reviews.map((review, index) => (
          <article
            key={`${dayId}-${placeId}-review-${index}`}
            className="relative"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                {review.authorName?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {review.authorName ? (
                    <span className="truncate text-sm font-semibold text-foreground">
                      {review.authorName}
                    </span>
                  ) : null}
                  {review.rating !== null ? (
                    <div className="flex items-center gap-1">
                      <StarIcon className="size-3 fill-chart-1 text-chart-1" />
                      <span className="text-xs font-medium text-foreground/80">
                        {review.rating.toFixed(1)}
                      </span>
                    </div>
                  ) : null}
                </div>
                {review.relativePublishTimeDescription ? (
                  <span className="text-xs text-muted-foreground">
                    {review.relativePublishTimeDescription}
                  </span>
                ) : null}
              </div>
            </div>
            {review.text ? (
              <p className="mt-2.5 pl-12 text-sm leading-[1.7] text-foreground/80">
                {review.text}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

function PlaceDetails({
  data,
  dayId,
  placeId,
}: {
  data: GooglePlaceEnrichedDetails;
  dayId: string;
  placeId: string;
}) {
  return (
    <div className="flex max-h-[92vh] flex-col overflow-hidden">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div className="p-5 sm:p-7">
          <PlaceHeroGallery photos={data.photos} displayName={data.displayName} />

          <div className="mt-7 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
            <div className="space-y-8">
              <PlaceHeader data={data} />

              <hr className="border-border/60" />

              <PlaceAbout
                editorialSummary={data.editorialSummary}
                reviewSummary={data.reviewSummary}
              />

              <PlaceReviews
                reviews={data.reviews}
                dayId={dayId}
                placeId={placeId}
              />
            </div>

            <aside className="space-y-8 lg:sticky lg:top-0">
              <PlaceOpeningHours
                weekdayDescriptions={data.weekdayDescriptions}
              />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ItineraryPlaceCardDialog({
  dayId,
  placeId,
  title,
  open,
  onOpenChange,
}: ItineraryPlaceCardDialogProps) {
  const { data, isPending, isError } = useQuery({
    ...googleMapsQueries.getPlaceDetails(placeId),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-[min(94vw,1080px)] sm:max-w-[min(94vw,1080px)] overflow-hidden border-border/60 bg-background p-0 shadow-[0_32px_120px_-40px_rgba(0,0,0,0.5)]">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {isPending ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 p-8">
            <Spinner className="size-8" />
            <p className="text-sm text-muted-foreground">
              Loading place details...
            </p>
          </div>
        ) : null}

        {!isPending && (isError || !data) ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 p-8 text-center">
            <Image
              src="/camera.png"
              alt=""
              width={88}
              height={88}
              className="opacity-70"
            />
            <p className="text-sm font-medium text-foreground">
              Could not load this place right now
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Try hovering again in a moment to refetch the details.
            </p>
          </div>
        ) : null}

        {!isPending && data ? (
          <PlaceDetails data={data} dayId={dayId} placeId={placeId} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
