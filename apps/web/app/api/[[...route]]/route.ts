import { createApp } from "@trip-loom/api";

const app = createApp({
  loggerServiceName: process.env.OTEL_SERVICE_NAME,
});

export const GET = app.handle;
export const POST = app.handle;
export const PUT = app.handle;
export const PATCH = app.handle;
export const DELETE = app.handle;
export const OPTIONS = app.handle;
