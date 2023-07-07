import CannonHttpJs from "../src/main";
import { describe, it, expect, beforeEach } from "vitest";
import nock from "nock";

describe("CannonHttpJS", () => {
  let httpClient: CannonHttpJs;

  beforeEach(() => {
    httpClient = new CannonHttpJs();
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
      data: "payload",
    });

    // Assertions
    expect(response.status).toBe(201);
    expect(response.data).toBe("POST response");

    // Ensure the mock URL was called
    expect(scope.isDone()).toBe(true);
  });

  // Add more test cases as needed
});
