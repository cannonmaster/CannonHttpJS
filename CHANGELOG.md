# Change Log

All notable changes to the CannonHttpJS library will be documented in this file.

## [1.0.0] - 2023-07-09

### Added

- Support for sending GET, POST, PUT, PATCH, and DELETE requests.
- Request interceptors to modify request configurations.
- Response interceptors to modify response data.
- Caching of responses for improved performance.
- Timeout handling to limit request duration.
- Base URL configuration for simplified URL setup.
- Default headers to apply to all requests.
- Retry mechanism to handle failed requests.
- Response data sanitization for data validation.

### Changed

- Renamed `request` method to `executeRequest`.
- Refactored internal request execution logic.
- Updated dependencies for improved compatibility.

### Fixed

- LRU cache strategy
