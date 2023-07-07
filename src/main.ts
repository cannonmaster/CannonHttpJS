let fetchImplementation: any;

if (typeof window === "undefined") {
  // Running in Node.js
  const { default: fetchNode } = await import("node-fetch");
  fetchImplementation = fetchNode;
} else {
  // Running in the browser
  fetchImplementation = window.fetch.bind(window);
}

type ResponseSanitizer<T> = (data: T) => T;
type RequestInterceptor<T> = (
  config: RequestOptions<T>
) => RequestOptions<T> | Promise<RequestOptions<T>>;
type ResponseInterceptor<T> = (
  response: ResponseData<T>
) => ResponseData<T> | Promise<ResponseData<T>>;

interface RequestOptions<T> {
  method?: string;
  url: string;
  params?: Record<string, string | number>;
  headers?: Record<string, string>;
  data?: any;
  files?: File[] | undefined;
  isFormData?: boolean; // Flag to indicate if it's a form POST request
  timeout?: number; // Timeout duration in milliseconds
}

interface ResponseData<T> {
  status: number;
  statusText: string;
  headers: Headers;
  data: T;
}
class CannonHttpJS<T = unknown> {
  private baseURL: string | undefined;
  private cacheSize: number = 0;
  private cache: Map<string, { data: ResponseData<T>; expiresAt: number }>;
  private defaultCacheTime: number = 0;
  private requestInterceptors: RequestInterceptor<T>[] = [];
  private responseInterceptors: ResponseInterceptor<T>[] = [];
  private defaultHeaders: Record<string, string> = {};
  private responseSanitizers: ResponseSanitizer<T>[] = [];
  private maxRetry: number = 0;

  constructor() {
    this.baseURL = undefined;
    this.cache = new Map();
  }

  public setCacheSize(cacheSize: number) {
    this.cacheSize = cacheSize;
  }

  public setRetry(maxRetry: number) {
    this.maxRetry = maxRetry;
  }

  public setCacheTime(cacheTime: number): void {
    this.defaultCacheTime = cacheTime;
  }

  public setBaseUrl(baseUrl: string): void {
    this.baseURL = baseUrl;
  }

  public addRequestInterceptor(interceptor: RequestInterceptor<T>): void {
    this.requestInterceptors.push(interceptor);
  }

  public addResponseInterceptor(interceptor: ResponseInterceptor<T>): void {
    this.responseInterceptors.push(interceptor);
  }

  public invalidateCache(url?: string): void {
    if (url) this.cache.delete(new URL(url, this.baseURL).href);
    else this.cache.clear();
  }

  public getOldestEntry() {
    let oldestExpiration = Infinity;
    let oldestEntry;
    for (const [url, data] of this.cache) {
      if (data.expiresAt < oldestExpiration) {
        oldestExpiration = data.expiresAt;
        oldestEntry = url;
      }
    }
    return oldestEntry;
  }

  private async executeRequest(
    config: RequestOptions<T>,
    retryCount = 0
  ): Promise<ResponseData<T>> {
    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      try {
        config = await interceptor(config);
      } catch (error: any) {
        throw new Error(`Request interceptor failed: ${error.message}`);
      }
    }

    const {
      method = "GET",
      url,
      params = {},
      headers = {},
      data,
      files,
      isFormData = false,
      timeout,
    } = config;

    const requestURL = new URL(url, this.baseURL);
    Object.keys(params).forEach((key) =>
      requestURL.searchParams.append(key, params[key].toString())
    );

    const abortController = new AbortController();
    const { signal } = abortController;

    const requestOptions: RequestInit = {
      method,
      headers: this.applyDefaultHeaders(headers), // Apply default headers
      body: undefined,
      signal,
    };

    if (data) {
      if (isFormData) {
        const formData = new FormData();

        for (const key in data) {
          if (data.hasOwnProperty(key)) {
            const value = data[key];
            if (value instanceof File) {
              formData.append(key, value);
            } else {
              formData.append(key, JSON.stringify(value));
            }
          }
        }

        requestOptions.body = formData;
      } else {
        requestOptions.body = JSON.stringify(data);
      }
    }

    try {
      let response: Response;
      if (timeout) {
        const timeoutPromise = new Promise<Response>((_, reject) => {
          setTimeout(() => {
            abortController.abort();
            reject(new Error(`Request timed out after ${timeout}ms`));
          }, timeout);
        });

        const fetchPromise = fetchImplementation(
          requestURL.href,
          requestOptions
        );

        response = await Promise.race([timeoutPromise, fetchPromise]);
      } else {
        response = await fetchImplementation(requestURL.href, requestOptions);
      }

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      let responseData: T;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        responseData = (await response.text()) as any as T;
      }

      const sanitizedData = this.sanitizeResponseData(responseData);

      let processedResponse: ResponseData<T> = {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: sanitizedData,
      };

      // Apply response interceptors
      for (const interceptor of this.responseInterceptors) {
        processedResponse = await interceptor(processedResponse);
      }

      if (method === "GET") {
        const expiration = Date.now() + this.defaultCacheTime;
        this.cache.set(requestURL.href, {
          data: processedResponse,
          expiresAt: expiration,
        });
      }

      if (this.cache.size > this.cacheSize) {
        const oldestEntry = this.getOldestEntry();
        if (oldestEntry) this.cache.delete(oldestEntry);
      }

      return processedResponse;
    } catch (error: any) {
      if (signal && signal.aborted) {
        throw new Error("Request was aborted");
      }
      if (retryCount < this.maxRetry) {
        const retryDelay = this.calculateRetryDelay(retryCount);
        await this.delay(retryDelay);
        this.executeRequest(config, retryCount + 1);
      }
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  private async delay(retryDelay: number): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, retryDelay);
    });
  }

  private calculateRetryDelay(retryCount: number) {
    const baseDealy = 500;
    return baseDealy * Math.pow(2, retryCount);
  }

  // public async request(config: RequestOptions<T>): Promise<ResponseData<T>> {
  //   return this.executeRequest(config);
  // }

  public get(
    url: string,
    config: RequestOptions<T> = {} as RequestOptions<T>
  ): Promise<ResponseData<T>> {
    const dataFromCache = this.cache.get(new URL(url, this.baseURL).href);
    if (dataFromCache && dataFromCache.expiresAt > Date.now()) {
      return Promise.resolve(dataFromCache.data);
    }
    return this.executeRequest({ ...config, url, method: "GET" });
  }

  public post(
    url: string,
    data: any,
    config: RequestOptions<T> = {} as RequestOptions<T>
  ): Promise<ResponseData<T>> {
    const { isFormData = false } = config;

    if (isFormData) {
      const formData = new FormData();

      if (data) {
        for (const key in data) {
          if (data.hasOwnProperty(key)) {
            const value = data[key];
            if (value instanceof File) {
              formData.append(key, value);
            } else {
              formData.append(key, JSON.stringify(value));
            }
          }
        }
      }
      data = formData;
    }
    // Regular POST request
    const response = this.executeRequest({
      ...config,
      url,
      method: "POST",
      data,
    });
    this.invalidateCache(url);
    return response;
  }

  // Add other HTTP methods (e.g., put, patch, delete) as needed

  public put(
    url: string,
    data: any,
    config: RequestOptions<T> = {} as RequestOptions<T>
  ): Promise<ResponseData<T>> {
    return this.executeRequest({ ...config, url, method: "PUT", data });
  }

  public patch(
    url: string,
    data: any,
    config: RequestOptions<T> = {} as RequestOptions<T>
  ): Promise<ResponseData<T>> {
    return this.executeRequest({ ...config, url, method: "PATCH", data });
  }

  public delete(
    url: string,
    config: RequestOptions<T> = {} as RequestOptions<T>
  ): Promise<ResponseData<T>> {
    return this.executeRequest({ ...config, url, method: "DELETE" });
  }

  public setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = headers;
  }

  private applyDefaultHeaders(
    headers: Record<string, string>
  ): Record<string, string> {
    return { ...this.defaultHeaders, ...headers };
  }

  public addResponseSanitizer(sanitizer: ResponseSanitizer<T>): void {
    this.responseSanitizers.push(sanitizer);
  }

  private sanitizeResponseData(data: any): any {
    // Perform default sanitization and validation on the response data
    // ...

    // Apply registered response sanitizers
    let sanitizedData = data;
    for (const sanitizer of this.responseSanitizers) {
      sanitizedData = sanitizer(sanitizedData);
    }

    // Return the sanitized data
    return sanitizedData;
  }
}
export type { ResponseData, RequestOptions };
export default CannonHttpJS;
