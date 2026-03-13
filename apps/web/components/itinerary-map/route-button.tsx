import Link from "next/link";
import { Button } from "../ui/button";
import { RouteIcon } from "lucide-react";

export function RouteButton({ routeUrl }: { routeUrl: string }) {
  return (
    <Link
      className="block absolute bottom-10 right-2"
      href={routeUrl}
      rel="noopener noreferer"
      target="_blank"
    >
      <Button>
        <RouteIcon />
        See Route for the day
      </Button>
    </Link>
  );
}
