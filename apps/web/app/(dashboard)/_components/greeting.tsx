import Image from "next/image";

interface GreetingProps {
  userName: string;
}

export function Greeting({ userName }: GreetingProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <section className="relative overflow-hidden py-12 lg:py-16">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
      <div className="absolute -right-20 -top-20 -z-10 size-64 rounded-full bg-primary/5 blur-3xl" />

      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
              {getGreeting()}, {userName}
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              Where would you like to go next? Let me help you book your perfect
              trip.
            </p>
          </div>

          <div className="hidden items-center gap-4 lg:flex">
            <div className="relative">
              <Image src="/plane.png" alt="" width={100} height={100} />
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <QuickAction
            icon="/island.png"
            title="Explore destinations"
            description="Discover your next adventure"
          />
          <QuickAction
            icon="/hotel.png"
            title="Book accommodations"
            description="Find the perfect place to stay"
          />
          <QuickAction
            icon="/backpack.png"
            title="Plan itinerary"
            description="Create your travel schedule"
          />
        </div>
      </div>
    </section>
  );
}

interface QuickActionProps {
  icon: string;
  title: string;
  description: string;
}

// TODO: Decide on AI prompts/actions for each
function QuickAction({ icon, title, description }: QuickActionProps) {
  return (
    <button className="group flex items-center gap-4 rounded-xl border border-border/60 bg-card/50 p-4 text-left transition-all hover:border-primary/30 hover:bg-card hover:shadow-sm">
      <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Image
          src={icon}
          alt=""
          width={64}
          height={64}
          className="transition-transform group-hover:scale-110"
        />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-foreground">{title}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </div>
    </button>
  );
}
