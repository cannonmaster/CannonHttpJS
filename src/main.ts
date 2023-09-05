const fetchImplementation = fetch;

type ResponseSanitizer<T> = (data: T) => T;
type RequestInterceptor<T> = (
  config: ExtendedRequestOptions<T>
) => ExtendedRequestOptions<T> | Promise<ExtendedRequestOptions<T>>;
type ResponseInterceptor<T> = (
  response: ResponseData<T>
) => ResponseData<T> | Promise<ResponseData<T>>;

type ExtendedRequestOptions<T> = RequestOptions<T> & RequestInit;
// @ts-ignore
interface RequestOptions<T = any> {
  url?: string | URL;
  params?: Record<string, string | number>;
  data?: any;
  files?: File[] | undefined;
  isFormData?: boolean; // Flag to indicate if it's a form POST request
  timeout?: number; // Timeout duration in milliseconds
  offline?: boolean;
  onDataChunk?: (chunk: any) => void;
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
    if (cacheTime <= 0) return;
    this.defaultCacheTime = cacheTime;
  }

  public setBaseUrl(baseUrl: string): void {
    this.baseURL = baseUrl;
  }

  public clearRequestInterceptor(interceptor?: RequestInterceptor<T>) {
    if (!interceptor) {
      this.requestInterceptors = [];
    }
  }

  public clearResoponseInterceptor(interceptor?: ResponseInterceptor<T>) {
    if (!interceptor) {
      this.responseInterceptors = [];
    }
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

  private kindOfObject(value: any) {
    if (Array.isArray(value)) {
      return false;
    } else if (value === null) {
      return false;
    } else {
      return typeof value === "object";
    }
  }

  private kindOfString(value: any) {
    return typeof value === "string";
  }

  // private kindOf(type: string) {
  //   const toString = Object.prototype.toString;

  //   return function (value: any) {
  //     return (
  //       type.toLowerCase() === toString.call(value).slice(8, -1).toLowerCase()
  //     );
  //   };
  // }

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
    config: ExtendedRequestOptions<T>,
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
      url = "",
      params = {},
      body,
      cache,
      credentials,
      headers,
      integrity,
      keepalive,
      mode,
      redirect,
      referrer,
      referrerPolicy,
      signal,
      window,
      data,
      isFormData = false,
      timeout,
      offline,
      onDataChunk,
      //@ts-ignore
      ...rest
    } = config;

    const requestURL = new URL(url, this.baseURL);

    Object.keys(params).forEach((key) =>
      requestURL.searchParams.append(key, params[key].toString())
    );

    const requestOptions: RequestInit = {
      method,
      cache,
      credentials,
      integrity,
      keepalive,
      mode,
      redirect,
      referrer,
      referrerPolicy,
      window,
      headers, // Apply default headers
      body,
      signal,
    };

    const abortController = new AbortController();
    if (!signal) {
      requestOptions.signal = abortController.signal;
    }

    if (data) {
      if (data instanceof FormData) {
        requestOptions.body = data;
      } else {
        if (isFormData) {
          const formData = new FormData();

          for (const key in data) {
            if (data.hasOwnProperty(key)) {
              const value = data[key];
              if (value instanceof File) {
                formData.append("file", value);
              } else if (value instanceof FileList) {
                for (let i = 0; i < value.length; i++) {
                  const file = value[i];
                  formData.append("file", file, file.name);
                }
              } else {
                formData.append(key, value);
              }
            }
          }
          requestOptions.body = formData;
        }

        if (!isFormData) {
          this.setDefaultHeaders({
            "Content-Type": "application/json; charset=utf-8",
          });
          if (this.kindOfObject(data)) {
            requestOptions.body = JSON.stringify(data);
          }

          if (this.kindOfString(data)) {
            if (this.kindOfObject(JSON.parse(data))) requestOptions.body = data;

            if (!this.kindOfObject(JSON.parse(data)))
              throw new Error("invalid data format");
          }
        }
      }
    }
    requestOptions.headers = this.applyDefaultHeaders(
      requestOptions.headers as Record<string, string>
    );

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

      if (response.body instanceof ReadableStream && onDataChunk) {
        console.log(123123);
        // Create a reader for the streaming body
        const reader = response.body.getReader();
        const streamedData: any[] = [];
        // Define a function to process chunks of data as they arrive
        const processData = async (
          reader: ReadableStreamDefaultReader<any>,
          onDataChunk?: (chunk: any) => void
        ) => {
          while (true) {
            const trunk = await reader.read();
            const { done } = trunk;
            // Process the chunk of data (result.value) here if needed

            if (done) {
              break;
            }
            // streamedData.push(textDecoder.decode(value));

            if (onDataChunk) {
              streamedData.push(onDataChunk(trunk));
            }
          }
        };

        // Start processing the data from the streaming response
        await processData(reader, onDataChunk);
        responseData = streamedData as any as T;
        // responseData = streamedData.join("") as any as T;
      } else {
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          responseData = await response.json();
        } else {
          responseData = (await response.text()) as any as T;
        }
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

      if (offline && method === "GET") {
        this.storeLocalData(requestURL.href, processedResponse);
      }

      if (method === "GET" && this.cacheSize > 0) {
        const expiration = Date.now() + this.defaultCacheTime;
        this.cache.set(requestURL.href, {
          data: processedResponse,
          expiresAt: expiration,
        });
        if (this.cache.size > this.cacheSize) {
          const oldestEntry = this.getOldestEntry();
          if (oldestEntry) this.cache.delete(oldestEntry);
        }
      }

      return processedResponse;
    } catch (error: any) {
      if (retryCount < this.maxRetry) {
        const retryDelay = this.calculateRetryDelay(retryCount);
        await this.delay(retryDelay);
        return this.executeRequest(config, retryCount + 1);
      }
      if (abortController) abortController.abort();

      throw new Error(
        `Request failed: ${error.message}, and the request was aborted`
      );
    }
  }

  private async delay(retryDelay: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, retryDelay);
    });
  }

  private calculateRetryDelay(retryCount: number) {
    const baseDelay = 500;
    const maxDelay = 5000;
    const delay = baseDelay * Math.pow(2, retryCount);
    return Math.min(delay, maxDelay);
  }

  // public async request(config: RequestOptions<T>): Promise<ResponseData<T>> {
  //   return this.executeRequest(config);
  // }

  private async storeLocalData(
    url: string,
    data: ResponseData<T>
  ): Promise<void> {
    const key = this.getLocalStorageKey(url);
    localStorage.setItem(key, JSON.stringify(data));
  }
  private async getLocalData(url: string): Promise<ResponseData<T> | null> {
    const key = this.getLocalStorageKey(url);
    const localData = await localStorage.getItem(key);
    if (localData) {
      return JSON.parse(localData) as ResponseData<T>;
    }
    return null;
  }

  public async stream(
    url: string,
    config: ExtendedRequestOptions<T> = {} as ExtendedRequestOptions<T>,
    onDataChunk: (chunk: any) => void
  ): Promise<ResponseData<T>> {
    if (typeof window !== "undefined") {
      const { offline } = config;
      if (offline) {
        const localData = await this.getLocalData(
          new URL(url, this.baseURL).href
        );

        if (localData) {
          return localData;
        }
      }
    }

    const dataFromCache = this.cache.get(new URL(url, this.baseURL).href);
    if (dataFromCache && dataFromCache.expiresAt > Date.now()) {
      dataFromCache.expiresAt = Date.now() + this.defaultCacheTime;
      return Promise.resolve(dataFromCache.data);
    }

    return this.executeRequest(
      { ...config, url, method: "GET", onDataChunk },
      0
    );
  }

  public async get(
    url: string,
    config: ExtendedRequestOptions<T> = {} as ExtendedRequestOptions<T>
  ): Promise<ResponseData<T>> {
    if (typeof window !== undefined) {
      const { offline } = config;
      if (offline) {
        const localData = await this.getLocalData(
          new URL(url, this.baseURL).href
        );

        if (localData) return localData;
      }
    }

    const dataFromCache = this.cache.get(new URL(url, this.baseURL).href);
    if (dataFromCache && dataFromCache.expiresAt > Date.now()) {
      dataFromCache.expiresAt = Date.now() + this.defaultCacheTime;
      return Promise.resolve(dataFromCache.data);
    }
    return this.executeRequest({ ...config, url, method: "GET" });
  }

  public async post(
    url: string,
    config: ExtendedRequestOptions<T> = {} as ExtendedRequestOptions<T>
  ): Promise<ResponseData<T>> {
    const response = await this.executeRequest({
      ...config,
      url,
      method: "POST",
    });
    this.invalidateCache(url);
    return response;
  }

  // Add other HTTP methods (e.g., put, patch, delete) as needed

  public put(
    url: string,
    config: ExtendedRequestOptions<T> = {} as ExtendedRequestOptions<T>
  ): Promise<ResponseData<T>> {
    return this.executeRequest({ ...config, url, method: "PUT" });
  }

  public patch(
    url: string,
    config: ExtendedRequestOptions<T> = {} as ExtendedRequestOptions<T>
  ): Promise<ResponseData<T>> {
    return this.executeRequest({ ...config, url, method: "PATCH" });
  }

  public delete(
    url: string,
    config: ExtendedRequestOptions<T> = {} as ExtendedRequestOptions<T>
  ): Promise<ResponseData<T>> {
    return this.executeRequest({ ...config, url, method: "DELETE" });
  }

  public setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
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

  private getLocalStorageKey(url: string): string {
    return `cannon_http_${url}`;
  }

  public invalidateLocalStorage(url?: string): void {
    if (url) {
      const key = this.getLocalStorageKey(url);
      localStorage.removeItem(key);
    } else {
      localStorage.clear();
    }
  }
}
export type { ResponseData, RequestOptions, ExtendedRequestOptions };
export default new CannonHttpJS();
