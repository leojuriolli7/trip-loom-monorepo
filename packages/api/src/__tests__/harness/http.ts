import { TEST_USER_ID_HEADER } from "./auth";

type JsonMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  method: JsonMethod;
  path: string;
  userId?: string;
  body?: unknown;
};

type JsonResponse<T> = {
  res: Response;
  body: T;
};

/**
 * Minimal request client for Elysia route tests.
 */
type AppHandler = {
  handle: (request: Request) => Promise<Response> | Response;
};

export function createJsonRequester(app: AppHandler) {
  const requestJson = async <T = any>({
    method,
    path,
    userId,
    body,
  }: RequestOptions): Promise<JsonResponse<T>> => {
    const headers = new Headers();

    if (userId) {
      headers.set(TEST_USER_ID_HEADER, userId);
    }

    if (body !== undefined) {
      headers.set("content-type", "application/json");
    }

    const res = await app.handle(
      new Request(`http://localhost${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      }),
    );

    const contentType = res.headers.get("content-type") ?? "";
    const json = contentType.includes("application/json")
      ? ((await res.json()) as T)
      : (null as T);

    return { res, body: json };
  };

  return {
    requestJson,
    get: <T = any>(path: string, userId?: string) =>
      requestJson<T>({ method: "GET", path, userId }),
    post: <T = any>(path: string, body?: unknown, userId?: string) =>
      requestJson<T>({ method: "POST", path, body, userId }),
    put: <T = any>(path: string, body?: unknown, userId?: string) =>
      requestJson<T>({ method: "PUT", path, body, userId }),
    patch: <T = any>(path: string, body?: unknown, userId?: string) =>
      requestJson<T>({ method: "PATCH", path, body, userId }),
    delete: <T = any>(path: string, userId?: string) =>
      requestJson<T>({ method: "DELETE", path, userId }),
  };
}
