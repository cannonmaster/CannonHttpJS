import CannonHttpJs, {
  RequestOptions,
  ResponseData,
  ExtendedRequestOptions,
} from "../src/main";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import nock, { RequestBodyMatcher } from "nock";
import CannonHttp from "@cannonui/httpjs";
// const CannonHttp = require("@cannonui/httpjs");
type RequestInterceptor<T> = (
  config: RequestOptions<T>
) => RequestOptions<T> | Promise<RequestOptions<T>>;

describe("CannonHttpJS", () => {
  let httpClient = CannonHttpJs;

  // production
  // let httpClient = CannonHttp;

  beforeEach(() => {
    // httpClient = new CannonHttpJs();
    httpClient.clearRequestInterceptor();
    httpClient.clearResoponseInterceptor();
    httpClient.invalidateCache();
    httpClient.setCacheTime(0);
    vi.spyOn(httpClient, "executeRequest" as any);
  });

  it("should throw an error when request interceptor fails", async () => {
    const requestInterceptor: RequestInterceptor<any> = async () => {
      throw new Error("Request interceptor failed");
    };

    httpClient.addRequestInterceptor(requestInterceptor);

    const config: ExtendedRequestOptions<any> = {
      url: "https://example.com",
    };

    try {
      await httpClient["executeRequest"](config);
      // Fail the test if no error is thrown
      expect(true).toBe(false);
    } catch (error) {
      expect(error.message).toContain("Request interceptor failed");
    }
  });

  it("should delay execution for the specified time", async () => {
    const delayTime = 1000; // 1 second

    const startTime = Date.now();
    await httpClient["delay"](delayTime);
    const endTime = Date.now();

    const elapsedTime = endTime - startTime;
    expect(elapsedTime).toBeGreaterThanOrEqual(delayTime);
  });

  it("should calculate the retry delay correctly", () => {
    const retryCount = 3;
    const expectedDelay = 4000; // 500 * 2^3 = 4000

    const delay = httpClient["calculateRetryDelay"](retryCount);
    expect(delay).toEqual(expectedDelay);
  });

  it("should send a GET request successfully", async () => {
    // Set the base URL
    httpClient.setBaseUrl("https://api.example.com");

    // Mock the URL
    const scope = nock("https://api.example.com")
      .get("/endpoint")
      .reply(200, "GET response");

    // Make the GET request
    const response = await httpClient.get("/endpoint");

    // Assertions
    expect(response.status).toBe(200);
    expect(response.data).toBe("GET response");

    // Ensure the mock URL was called
    expect(scope.isDone()).toBe(true);
  });

  it("should send a POST request successfully", async () => {
    // Mock the URL
    const scope = nock("https://api.example.com")
      .post("/endpoint")
      .reply(201, "POST response");

    // Make the POST request
    const response = await httpClient.post("https://api.example.com/endpoint", {
      data: { a: 123 },
    });

    // Assertions
    expect(response.status).toBe(201);
    expect(response.data).toBe("POST response");

    // Ensure the mock URL was called
    expect(scope.isDone()).toBe(true);
  });

  it("should handle request interceptors", async () => {
    // Set the base URL
    httpClient.setBaseUrl("https://api.example.com");

    // Mock the URL
    const scope = nock("https://api.example.com")
      .get("/endpoint")
      .reply(200, "GET response");

    // Add a request interceptor
    httpClient.addRequestInterceptor((config: ExtendedRequestOptions<any>) => {
      // Modify the request config
      config.headers = {
        ...config.headers,
        Authorization: "Bearer token",
      } as Record<string, string>;
      return config;
    });

    // Make the GET request
    const response = await httpClient.get("/endpoint");

    // Assertions
    expect(response.status).toBe(200);
    expect(response.data).toBe("GET response");

    // Ensure the mock URL was called
    expect(scope.isDone()).toBe(true);
    // Ensure the request interceptor was applied
    expect(scope.pendingMocks().length).toBe(0);
  });

  it("should invalidate the cache and send a new GET request successfully", async () => {
    // Set the base URL
    httpClient.setBaseUrl("https://api.example.com");

    // Mock the URL for the initial request
    const scope = nock("https://api.example.com")
      .get("/endpoint")
      .reply(200, "GET response");

    // Make the initial GET request
    const initialResponse = await httpClient.get("/endpoint");

    // Assertions for the initial request
    expect(initialResponse.status).toBe(200);
    expect(initialResponse.data).toBe("GET response");
    expect(scope.isDone()).toBe(true);

    // Invalidate the cache
    httpClient.invalidateCache("/endpoint");

    // Mock the URL for the subsequent request
    const scopeAfterInvalidation = nock("https://api.example.com")
      .get("/endpoint")
      .reply(200, "New GET response");

    // Make the GET request again
    const responseAfterInvalidation = await httpClient.get("/endpoint");

    // Assertions for the subsequent request
    expect(responseAfterInvalidation.status).toBe(200);
    expect(responseAfterInvalidation.data).toBe("New GET response");
    expect(scopeAfterInvalidation.isDone()).toBe(true);
  });
  it("should invalidate all cache", async () => {
    // Set the base URL
    httpClient.setBaseUrl("https://api.example.com");

    // Mock the URL
    const scope = nock("https://api.example.com")
      .get("/endpoint")
      .reply(200, "GET response");

    // Make the GET request
    const response = await httpClient.get("/endpoint");

    // Assertions
    expect(response.status).toBe(200);
    expect(response.data).toBe("GET response");

    // Ensure the mock URL was called
    expect(scope.isDone()).toBe(true);

    // Invalidate all cache
    httpClient.invalidateCache();

    // Mock the URL for the subsequent request
    const scopeAfterInvalidation = nock("https://api.example.com")
      .get("/endpoint")
      .reply(200, "GET response");

    // Make the GET request again
    const responseAfterInvalidation = await httpClient.get("/endpoint");

    // Ensure the response is not retrieved from the cache
    expect(responseAfterInvalidation.status).toBe(200);
    expect(responseAfterInvalidation.data).toBe("GET response");

    // Ensure the mock URL is called again
    expect(scope.pendingMocks().length).toBe(0);
  });

  it("should handle PATCH request", async () => {
    // Mock the URL with key-value matching
    const scope = nock("https://api.example.com")
      .patch("/endpoint", { key: "value" })
      .reply(200, "PATCH response");

    // Make the PATCH request
    const response = await httpClient.patch(
      "https://api.example.com/endpoint",
      { data: { key: "value" } }
    );

    // Assertions
    expect(response.status).toBe(200);
    expect(response.data).toBe("PATCH response");

    // Ensure the mock URL was called
    expect(scope.isDone()).toBe(true);
  });
  it("should handle request timeout", async () => {
    // Set the base URL
    httpClient.setBaseUrl("https://api.example.com");

    // Mock the URL
    const scope = nock("https://api.example.com")
      .get("/endpoint")
      .delay(1000) // Delay the response by 1 second
      .reply(200, "GET response");

    // Make the GET request with a timeout of 500 milliseconds
    const timeout = 500;
    const requestOptions = { url: "/endpoint", timeout }; // Include the `url` and `timeout` properties in RequestOptions

    // Ensure the request throws an error due to timeout
    await expect(() =>
      httpClient.get("/endpoint", requestOptions)
    ).rejects.toThrowError(/Request timed out after \d+ms/);

    // Ensure the mock URL was called
    expect(scope.isDone()).toBe(true);
  });

  it("should append query parameters to the URL", async () => {
    // Set the base URL
    httpClient.setBaseUrl("https://api.example.com");

    // Mock the URL
    const scope = nock("https://api.example.com")
      .get("/endpoint?key1=value1&key2=value2")
      .reply(200, "GET response");

    // Make the GET request with query parameters
    const response = await httpClient.get("/endpoint", {
      params: { key1: "value1", key2: "value2" },
    });

    // Assertions
    expect(response.status).toBe(200);
    expect(response.data).toBe("GET response");

    // Ensure the mock URL was called
    expect(scope.isDone()).toBe(true);
  });

  it("should handle PUT request", async () => {
    // Mock the URL with key-value matching
    const scope = nock("https://api.example.com")
      .put("/endpoint", { key: "value" })
      .reply(200, "PUT response");

    // Make the PUT request
    const response = await httpClient.put("https://api.example.com/endpoint", {
      data: { key: "value" },
    });

    // Assertions
    expect(response.status).toBe(200);
    expect(response.data).toBe("PUT response");

    // Ensure the mock URL was called
    expect(scope.isDone()).toBe(true);
  });

  it("should handle DELETE request", async () => {
    // Mock the URL
    const scope = nock("https://api.example.com")
      .delete("/endpoint")
      .reply(200, "DELETE response");

    // Make the DELETE request
    const response = await httpClient.delete(
      "https://api.example.com/endpoint"
    );

    // Assertions
    expect(response.status).toBe(200);
    expect(response.data).toBe("DELETE response");

    // Ensure the mock URL was called
    expect(scope.isDone()).toBe(true);
  });

  it("should handle response interceptors", async () => {
    // Mock the URL
    const scope = nock("https://api.example.com")
      .get("/endpoint")
      .reply(200, "GET response");

    // Add a response interceptor
    httpClient.addResponseInterceptor((response) => {
      // Modify the response data
      response.data = "Modified response";
      return response;
    });

    // Make the GET request
    const response = await httpClient.get("https://api.example.com/endpoint");

    // Assertions
    expect(response.status).toBe(200);
    expect(response.data).toBe("Modified response");

    // Ensure the mock URL was called
    expect(scope.isDone()).toBe(true);
  });

  it("should handle response sanitizers", async () => {
    // Mock the URL
    const scope = nock("https://api.example.com")
      .get("/endpoint")
      .reply(200, { data: "Original data" });

    // Add a response sanitizer
    httpClient.addResponseSanitizer((data: any) => {
      // Sanitize the response data
      return "Sanitized data";
    });

    // Make the GET request
    const response = await httpClient.get("https://api.example.com/endpoint");

    // Assertions
    expect(response.status).toBe(200);
    expect(response.data).toBe("Sanitized data");

    // Ensure the mock URL was called
    expect(scope.isDone()).toBe(true);
  });

  it("should set cache size", () => {
    const cacheSize = 10;
    httpClient.setCacheSize(cacheSize);

    // Get the cache size
    const currentCacheSize = httpClient["cacheSize"];

    // Assertion
    expect(currentCacheSize).toBe(cacheSize);
  });

  it("should set retry count", () => {
    const maxRetry = 3;
    httpClient.setRetry(maxRetry);

    // Get the retry count
    const currentMaxRetry = httpClient["maxRetry"];

    // Assertion
    expect(currentMaxRetry).toBe(maxRetry);
  });

  it("should set cache time", () => {
    const cacheTime = 60000;
    httpClient.setCacheTime(cacheTime);

    // Get the default cache time
    const currentCacheTime = httpClient["defaultCacheTime"];

    // Assertion
    expect(currentCacheTime).toBe(cacheTime);
  });

  it("should retry the request based on the maxRetry configuration", async () => {
    // Set the maxRetry value to 3
    const maxRetry = 3;
    httpClient.setRetry(maxRetry);

    // Set up a mock URL that always returns an error
    const scope = nock("https://api.example.com")
      .get("/endpoint")
      .replyWithError("Request error");

    // Make the GET request
    try {
      await httpClient.get("https://api.example.com/endpoint");
    } catch (error) {
      // Ensure the error message matches the expected format

      expect(error.message).toMatch(
        /^Request failed.*and the request was aborted$/s
      );

      // Ensure the 'executeRequest' method was called the expected number of times
      expect(httpClient["executeRequest"]).toHaveBeenCalledTimes(maxRetry + 1);

      // Ensure the mock URL was called the expected number of times
      expect(scope.isDone()).toBe(true);
    }
  });

  afterEach(() => {
    nock.cleanAll();
  });
});
