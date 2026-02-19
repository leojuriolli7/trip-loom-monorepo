import React from "react";
import { StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ratingVariants = {
  default: {
    star: "text-foreground",
    emptyStar: "text-muted-foreground",
  },
  yellow: {
    star: "text-yellow-500",
    emptyStar: "text-yellow-200",
  },
};

interface RatingsProps extends React.HTMLAttributes<HTMLDivElement> {
  rating: number;
  totalStars?: number;
  size?: number;
  fill?: boolean;
  variant?: keyof typeof ratingVariants;
}

const Ratings = ({ ...props }: RatingsProps) => {
  const {
    rating,
    totalStars = 5,
    size = 12,
    fill = true,
    variant = "yellow",
  } = props;

  const fullStars = Math.floor(rating);
  const partialStar =
    rating % 1 > 0 ? (
      <PartialStar
        fillPercentage={rating % 1}
        size={size}
        className={cn(ratingVariants[variant].star)}
      />
    ) : null;

  return (
    <div className={cn("flex items-center gap-1")} {...props}>
      {[...Array(fullStars)].map((_, i) => (
        <StarIcon
          key={i}
          size={size}
          className={cn(
            fill ? "fill-current" : "fill-transparent",
            ratingVariants[variant].star,
          )}
        />
      ))}
      {partialStar}
      {[...Array(totalStars - fullStars - (partialStar ? 1 : 0))].map(
        (_, i) => (
          <StarIcon
            key={i + fullStars + 1}
            size={size}
            className={cn(ratingVariants[variant].emptyStar)}
          />
        ),
      )}
    </div>
  );
};

interface PartialStarProps {
  fillPercentage: number;
  size: number;
  className?: string;
}
const PartialStar = ({ ...props }: PartialStarProps) => {
  const { fillPercentage, size, className } = props;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <StarIcon size={size} className={cn("fill-transparent", className)} />
      <div
        style={{
          position: "absolute",
          top: 0,
          overflow: "hidden",
          width: `${fillPercentage * 100}%`,
        }}
      >
        <StarIcon size={size} className={cn("fill-current", className)} />
      </div>
    </div>
  );
};

export { Ratings };
