interface PollOptions<TData, TError> {
  /**
   * Function that returns a promise to be polled
   */
  createPromise: () => Promise<TData>;
  /**
   * Called when the promise resolves successfully. Must return
   * a boolean indicating if the polling should continue or stop.
   */
  onSuccess: (data: TData, attempt: number) => boolean | Promise<boolean>;

  /**
   * The error that occurred. Called when the promise rejects.
   */
  onError?: (error: TError) => void;
  /**
   * Interval between polls in milliseconds. Defaults to 2000.
   */
  interval?: number;
  /**
   * Maximum number of attempts before giving up. Defaults to Infinity.
   */
  maxAttempts?: number;
  /**
   * AbortSignal to cancel the polling
   */
  abortSignal?: AbortSignal;
}

/**
 * A generic polling function that repeatedly calls a promise until a condition is met.
 * Returns a promise that resolves when polling is complete.
 */
async function poll<TData, TError = unknown>({
  createPromise,
  onSuccess,
  onError,
  interval = 2000,
  maxAttempts = Infinity,
  abortSignal,
}: PollOptions<TData, TError>): Promise<void> {
  let attempts = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  const wait = (ms: number): Promise<void> =>
    new Promise((resolve, reject) => {
      if (abortSignal?.aborted) {
        reject(new Error("Polling aborted"));
        return;
      }

      const abortListener = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        reject(new Error("Polling aborted"));
      };

      abortSignal?.addEventListener("abort", abortListener);

      timeoutId = setTimeout(() => {
        timeoutId = null;
        abortSignal?.removeEventListener("abort", abortListener);
        resolve();
      }, ms);
    });

  const executePoll = async (): Promise<void> => {
    if (abortSignal?.aborted) {
      return;
    }

    if (attempts >= maxAttempts) {
      return;
    }

    attempts++;

    try {
      const data = await createPromise();
      const shouldContinue = await Promise.resolve(onSuccess(data, attempts));

      if (!shouldContinue) {
        return;
      }

      await wait(interval);
      return executePoll();
    } catch (error) {
      // If the error is due to abort signal having just aborted, don't call onError.
      if (abortSignal?.aborted) {
        return;
      }

      onError?.(error as TError);
      return;
    }
  };

  return executePoll();
}

export { poll };
