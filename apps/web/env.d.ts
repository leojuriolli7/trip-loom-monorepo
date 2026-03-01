export interface WebAppEnv {
  NEXT_PUBLIC_API_BASE_URL: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
}

declare global {
  namespace NodeJS {
    // eslint-disable-next-line
    interface ProcessEnv extends WebAppEnv {}
  }
}

export {};
