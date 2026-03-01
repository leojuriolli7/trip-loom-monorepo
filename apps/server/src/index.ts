import { initOtel } from "@trip-loom/otel";

initOtel({
  serviceName: process.env.OTEL_SERVICE_NAME,
  traceExporterUrl: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  logsExporterUrl: process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT,
});

import { createApp } from "@trip-loom/api";

const app = createApp({
  loggerServiceName: process.env.OTEL_SERVICE_NAME,
});

app.listen(3001, (server) => {
  console.log("TripLoom API running on http://localhost:3001");
});
