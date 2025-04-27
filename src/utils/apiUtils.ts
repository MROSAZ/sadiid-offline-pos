export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const withRetry = async <T>(
  fn: () => Promise<T>, 
  retries = 3, 
  delayMs = 1000,
  backoff = 2
): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries === 0 || error?.response?.status !== 429) {
      throw error;
    }
    await delay(delayMs);
    return withRetry(fn, retries - 1, delayMs * backoff, backoff);
  }
};