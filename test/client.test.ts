// @vitest-environment jsdom
import { s } from "vitest/dist/types-198fd1d9";
import CannonHttpJs, { RequestOptions, ResponseData } from "../src/main";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

type RequestInterceptor<T> = (
  config: RequestOptions<T>
) => RequestOptions<T> | Promise<RequestOptions<T>>;

describe("CannonHttpJS", () => {
  let httpClient = CannonHttpJs;

  beforeEach(() => {
    // httpClient = new CannonHttpJs();
    httpClient.clearRequestInterceptor();
    httpClient.clearResoponseInterceptor();
    httpClient.invalidateCache();
    httpClient.setCacheTime(0);
    vi.spyOn(httpClient, "executeRequest" as any);
  });

  it("should get formdata if the isFormData is set to true", async () => {
    const data = { a: 123, b: "012" };

    httpClient.setBaseUrl("http://localhost:3000");

    const response = (await httpClient.post("/is-form-data", {
      data,
      isFormData: true,
    })) as ResponseData<string>;
    // Assertions
    expect(response.data.includes("multipart/form-data;")).toBe(true);
  });

  it("should get oldest cache entry", async () => {
    httpClient.setBaseUrl("http://localhost:3000");
    httpClient.setCacheSize(10);
    httpClient.setCacheTime(100000);
    await httpClient.get("/");
    await httpClient.get("/default-header");
    await httpClient.get("/endpoint");

    const cache = httpClient.getOldestEntry();

    // Assertions
    expect(cache).toBe("http://localhost:3000/");
  });

  it("should set multipart content type if data is formData", async () => {
    const data = new FormData();
    data.append("a", "123");
    httpClient.setBaseUrl("http://localhost:3000");
    const response = (await httpClient.post("/form-data", {
      data,
    })) as ResponseData<string>;
    // Assertions
    expect(response.data.includes("multipart/form-data;")).toBe(true);
  });

  it("should throw an error when request interceptor fails", async () => {
    const requestInterceptor: RequestInterceptor<any> = async () => {
      throw new Error("Request interceptor failed");
    };

    httpClient.addRequestInterceptor(requestInterceptor);

    const config: RequestOptions<any> = {
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
    httpClient.setBaseUrl("http://localhost:3000");

    // Make the GET request
    const response = await httpClient.get("/get-endpoint", {
      params: { key1: "value1", key2: "value2" },
    });

    // Assertions
    expect(response.status).toBe(200);
    expect(response.data).toBe("GET response");
  });

  it("should throw error on invalid data formmat", async () => {
    // Make the POST request
    const data = "123";

    // Assertions
    await expect(
      httpClient.post("http://localhost:3000/endpoint", {
        data,
      })
    ).rejects.toThrowError("invalid data format");
  });

  it("should send a POST request successfully", async () => {
    // Make the POST request
    const data = { a: 123 };
    const response = await httpClient.post("http://localhost:3000/endpoint", {
      data,
    });

    // Assertions
    expect(response.status).toBe(200);
    expect(response.data).toBe("post response");
  });

  it("should handle request interceptors", async () => {
    // Set the base URL
    httpClient.setBaseUrl("http://localhost:3000");

    // Add a request interceptor
    httpClient.addRequestInterceptor((config) => {
      // Modify the request config
      config.headers = {
        ...config.headers,
        Authorization: "Bearer token",
      };
      return config;
    });

    // Make the GET request
    const response = await httpClient.get("/auth-token");

    // Assertions
    expect(response.status).toBe(200);
    expect(response.data).toBe("auth token detected");
  });

  it("should invalidate the cache and send a new GET request successfully", async () => {
    // Set the base URL
    httpClient.setBaseUrl("http://localhost:3000");

    // Make the initial GET request
    const initialResponse = await httpClient.get("/cache");

    // Assertions for the initial request
    expect(initialResponse.status).toBe(200);
    expect(initialResponse.data).toBe("Init connection");
    // Invalidate the cache
    httpClient.invalidateCache("/cache");

    // Make the GET request again
    const responseAfterInvalidation = await httpClient.get("/cache");

    // Assertions for the subsequent request
    expect(responseAfterInvalidation.status).toBe(200);
    expect(responseAfterInvalidation.data).toBe("Init connection");
  });

  it("should return data from the cache ", async () => {
    // Set the base URL
    httpClient.setBaseUrl("http://localhost:3000");
    httpClient.setCacheSize(10);
    httpClient.setCacheTime(10000000);

    // Make the initial GET request
    const initialResponse = await httpClient.get("/cache");

    // Assertions for the initial request
    expect(initialResponse.status).toBe(200);
    expect(initialResponse.data).toBe("Init connection");
    initialResponse.data = "from cache";

    // // // Make the GET request again
    const responseAfterInvalidation = await httpClient.get("/cache");

    // // // Assertions for the subsequent request
    expect(responseAfterInvalidation.status).toBe(200);
    expect(responseAfterInvalidation.data).toBe("from cache");
  });

  it("should invalidate all cache", async () => {
    // Set the base URL
    httpClient.setBaseUrl("http://localhost:3000");

    // Make the GET request
    const response = await httpClient.get("/endpoint");

    // Assertions
    expect(response.status).toBe(200);
    expect(response.data).toBe("get response");

    // Invalidate all cache
    httpClient.invalidateCache();

    // Make the GET request again
    const responseAfterInvalidation = await httpClient.get("/endpoint");

    // Ensure the response is not retrieved from the cache
    expect(responseAfterInvalidation.status).toBe(200);
    expect(responseAfterInvalidation.data).toBe("get response");
  });

  // it("should handle PATCH request", async () => {
  //   // Make the PATCH request
  //   const response = await httpClient.patch("http://localhost:3000/endpoint", {
  //     key: "value",
  //   });

  //   // Assertions
  //   expect(response.status).toBe(200);
  //   expect(response.data).toBe("patch response");
  // });
  // it("should handle request timeout", async () => {
  //   // Set the base URL
  //   httpClient.setBaseUrl("http://localhost:3000");

  //   // Make the GET request with a timeout of 500 milliseconds
  //   const timeout = 500;
  //   const requestOptions = { url: "/delay", timeout }; // Include the `url` and `timeout` properties in RequestOptions

  //   // Ensure the request throws an error due to timeout
  //   await expect(() =>
  //     httpClient.get("/delay", requestOptions)
  //   ).rejects.toThrowError(/Request timed out after \d+ms/);
  // });

  // it("should handle request timeout with success", async () => {
  //   // Set the base URL
  //   httpClient.setBaseUrl("http://localhost:3000");

  //   // Make the GET request with a timeout of 500 milliseconds
  //   const timeout = 3000;
  //   const requestOptions = { url: "/delay", timeout }; // Include the `url` and `timeout` properties in RequestOptions

  //   // Ensure the request throws an error due to timeout
  //   const res = await httpClient.get("/delay", requestOptions);
  //   expect(res.status).toBe(200);
  //   expect(res.data).toBe("timeout working");
  // });

  // it("should append query parameters to the URL", async () => {
  //   // Set the base URL
  //   httpClient.setBaseUrl("http://localhost:3000");

  //   // Make the GET request with query parameters
  //   const response = await httpClient.get("/param", {
  //     params: { key1: "value1", key2: "value2" },
  //   });

  //   // Assertions
  //   expect(response.status).toBe(200);
  //   expect(response.data).toBe("/param?key1=value1&key2=value2");
  // });

  // it("should handle PUT request", async () => {
  //   // Make the PUT request
  //   const response = await httpClient.put("http://localhost:3000/endpoint", {
  //     key: "value",
  //   });

  //   // Assertions
  //   expect(response.status).toBe(200);
  //   expect(response.data).toBe("put response");
  // });

  // it("should handle DELETE request", async () => {
  //   // Make the DELETE request
  //   const response = await httpClient.delete("http://localhost:3000/endpoint");

  //   // Assertions
  //   expect(response.status).toBe(200);
  //   expect(response.data).toBe("delete response");
  // });

  it("should handle response interceptors", async () => {
    // Add a response interceptor
    httpClient.addResponseInterceptor((response) => {
      // Modify the response data
      response.data = "Modified response";
      return response;
    });

    // Make the GET request
    const response = await httpClient.get("http://localhost:3000/endpoint");

    // Assertions
    expect(response.status).toBe(200);
    expect(response.data).toBe("Modified response");
  });

  it("should handle default headers", async () => {
    // Set default headers
    httpClient.setDefaultHeaders({
      "Content-Type": "application/json",
      "x-custom": "x",
    });

    // Make the GET request
    const response = await httpClient.get(
      "http://localhost:3000/default-header"
    );

    // Assertions
    expect(response.status).toBe(200);
    expect(response.data).toBe("x");
  });

  it("should handle response sanitizers", async () => {
    // Add a response sanitizer
    httpClient.addResponseSanitizer((data: any) => {
      // Sanitize the response data
      return "Sanitized data";
    });

    // Make the GET request
    const response = await httpClient.get("http://localhost:3000/endpoint");

    // Assertions
    expect(response.status).toBe(200);
    expect(response.data).toBe("Sanitized data");
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

    // Make the GET request
    try {
      await httpClient.get("http://localhost:3000/max");
    } catch (error) {
      // Ensure the error message matches the expected format

      expect(error.message).toMatch(
        /^Request failed.*and the request was aborted$/s
      );

      // Ensure the 'executeRequest' method was called the expected number of times
      expect(httpClient["executeRequest"]).toHaveBeenCalledTimes(maxRetry + 1);
    }
  });

  it("should get the right cache key after renmove the oldest cache key", async () => {
    // Set the max cache value to 2
    httpClient.setCacheSize(2);
    httpClient.setCacheTime(100000);

    await httpClient.get("http://localhost:3000/cache");
    await httpClient.get("http://localhost:3000/");
    await httpClient.get("http://localhost:3000/auth-token");

    expect(httpClient.getOldestEntry()).toBe("http://localhost:3000/");
    expect(httpClient.cache.size).toBe(2);
  });

  // it("should formdata handle file success", async () => {
  //   const formData = {
  //     a: 123,
  //     file: new File(["Hello, World!"], "myfile.txt", { type: "text/plain" }),
  //   };
  //   const formData = new FormData();
  //   formData.append("a", "123");
  //   formData.append(
  //     "file",
  //     new File(["Hello, World!"], "myfile.txt", { type: "text/plain" })
  //   );
  //   fetch("http://localhost:3000/file", {
  //     method: "POST",
  //     body: formData,
  //   }).catch((err) => {
  //     console.log(err);
  //   });
  //   httpClient.setBaseUrl("http://localhost:3000");
  //   const response = await httpClient.post("/file", {
  //     data: formData,
  //     isFormData: true,
  //   });
  //   // Assertions
  //   expect(response.data).toBe("abc");
  // });

  afterEach(() => {});
});
