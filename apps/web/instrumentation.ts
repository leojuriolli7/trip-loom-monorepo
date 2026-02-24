export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initOtel } = await import("@trip-loom/otel");
    initOtel({
      serviceName: process.env.OTEL_SERVICE_NAME,
      traceExporterUrl: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
      logsExporterUrl: process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT,
    });
  }
}
