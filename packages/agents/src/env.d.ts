export type AgentsEnv = {
  SUPERVISOR_MODEL: string;
  DESTINATION_AGENT_MODEL: string;
  FLIGHT_AGENT_MODEL: string;
  HOTEL_AGENT_MODEL: string;
  ITINERARY_AGENT_MODEL: string;
  OPENAI_API_KEY: string;
};

declare global {
  namespace NodeJS {
    interface ProcessEnv extends AgentsEnv {}
  }
}

export {};
