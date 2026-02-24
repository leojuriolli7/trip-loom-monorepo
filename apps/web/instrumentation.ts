export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initOtel } = await import("@trip-loom/api/otel");
    initOtel();
  }
}
