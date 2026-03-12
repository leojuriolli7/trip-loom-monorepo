import { PgInstrumentation } from "@opentelemetry/instrumentation-pg";

const instrumentation = new PgInstrumentation();

instrumentation.enable();
