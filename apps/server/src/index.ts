import { createApp } from "@trip-loom/api";

const app = createApp({
  loggerServiceName: process.env.OTEL_SERVICE_NAME,
});

app.listen(3001, () => {
  console.log("TripLoom API running on http://localhost:3001");
});
