import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPinIcon, SparklesIcon } from "lucide-react";
import Image from "next/image";

export interface Destination {
  id: string;
  name: string;
  country: string;
  imageUrl: string;
  description: string;
  matchReason?: string;
}

interface DestinationCardProps {
  destination: Destination;
}

export function DestinationCard({ destination }: DestinationCardProps) {
  return (
    <Card className="group cursor-pointer overflow-hidden border-border/60 p-0 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="relative aspect-3/4 overflow-hidden">
        <Image
          src={destination.imageUrl}
          alt={destination.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/10" />

        <div className="absolute inset-0 flex flex-col justify-end p-4">
          <CardHeader className="gap-1 p-0">
            <CardTitle className="text-lg font-semibold tracking-tight text-white drop-shadow-sm">
              {destination.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-1.5 text-white/80">
              <MapPinIcon className="size-3.5" />
              <span className="text-sm font-medium">{destination.country}</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="mt-3 p-0">
            <p className="line-clamp-2 text-sm leading-relaxed text-white/70">
              {destination.description}
            </p>
          </CardContent>

          {destination.matchReason && (
            <CardFooter className="mt-3 p-0">
              <Badge
                variant="secondary"
                className="gap-1.5 border-0 bg-white/15 text-xs font-medium text-white backdrop-blur-sm"
              >
                <SparklesIcon className="size-3" />
                {destination.matchReason}
              </Badge>
            </CardFooter>
          )}
        </div>
      </div>
    </Card>
  );
}
