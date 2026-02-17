import { WizardProvider } from "./_components/wizard-context";
import { Wizard } from "./_components/wizard";
import { notFound } from "next/navigation";

/**
 * Internal development page for testing the API and frontend API integration.
 */
export default function ApiCrudPage() {
  if (process.env.NODE_ENV === "production") notFound();

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
