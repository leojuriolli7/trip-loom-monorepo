import { WizardProvider } from "./_components/wizard-context";
import { Wizard } from "./_components/wizard";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/api/server-session";

/**
 * Internal development page for testing the API and frontend API integration.
 */
export default async function ApiCrudPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const session = await getServerSession();

  if (!session) {
    redirect("/enter");
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">API CRUD Testing</h1>
      </div>
      <WizardProvider>
        <Wizard />
      </WizardProvider>
    </div>
  );
}
