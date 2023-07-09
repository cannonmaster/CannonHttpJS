# CannonHttpJS

CannonHttpJS is a versatile HTTP client library that provides a simple and flexible interface for making HTTP requests in both Node.js and browser environments. It offers features such as request interceptors, response interceptors, caching, timeout handling, and more. With CannonHttpJS, you can easily handle RESTful APIs and communicate with servers to fetch and send data.

## Features

- **HTTP Methods**: Perform common HTTP methods like GET, POST, PUT, PATCH, and DELETE.
- **Request Interceptors**: Intercept and modify the request configuration before sending the request.
- **Response Interceptors**: Intercept and modify the response data after receiving the response.
- **Caching**: Cache responses to improve performance and reduce redundant requests.
- **Timeout Handling**: Set timeouts for requests to ensure they don't take too long.
- **Base URL**: Define a base URL to simplify request URLs.
- **Default Headers**: Set default headers that will be applied to all requests.
- **Retry Mechanism**: Retry failed requests with configurable retry count and delay.

## Installation

To install CannonHttpJS, you can use npm or yarn:

```bash
npm install cannon-http-js
```

or

```bash
yarn add cannon-http-js
```

## Usage

Here's a basic example of how to use CannonHttpJS:

```javascript
import http from "cannon-http-js";

// Set base URL
http.setBaseUrl("https://api.example.com");

// Perform a GET request
http
  .get("/users")
  .then((response) => {
    console.log(response.data);
  })
  .catch((error) => {
    console.error(error);
  });

// Perform a POST request
const postData = { name: "John Doe", email: "john@example.com" };
http
  .post("/users", { data: postData })
  .then((response) => {
    console.log(response.data);
  })
  .catch((error) => {
    console.error(error);
  });
```

For more detailed usage examples and information on available methods and options, please refer to the [Documentation](link-to-documentation).

## Contributions

Contributions are welcome! If you have any suggestions, bug reports, or feature requests, please create an issue on the [GitHub repository](link-to-github-repo).

## License

CannonHttpJS is released under the [MIT License](link-to-license).
