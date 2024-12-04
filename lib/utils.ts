export interface RetryConfig {
  retries: number;
  minTimeout: number;
  maxTimeout: number;
}

export function retry<T>(fn: () => Promise<T>, config: RetryConfig): () => Promise<T> {
  return async () => {
    let lastError;
    for (let i = 0; i < config.retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        await new Promise(resolve => 
          setTimeout(resolve, Math.min(config.minTimeout * Math.pow(2, i), config.maxTimeout))
        );
      }
    }
    throw lastError;
  };
}
