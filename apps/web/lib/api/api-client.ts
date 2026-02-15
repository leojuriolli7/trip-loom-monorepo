import { createApiClient } from "@trip-loom/api/client";

export const apiClient = createApiClient(process.env.NEXT_PUBLIC_API_BASE_URL);
