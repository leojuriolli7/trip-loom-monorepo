import { createApp } from "@trip-loom/api";

const app = createApp({
  serviceName: process.env.OTEL_SERVICE_NAME,
  traceExporterUrl: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  logsExporterUrl: process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT,
});

app.listen(3001, () => {
  console.log("TripLoom API running on http://localhost:3001");
});
