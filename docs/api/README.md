# API Documentation

This directory contains documentation for the REST API.

## Endpoints

### Health Check
- `GET /v1/health`
  - Returns the status of the API.

## Authentication
(To be added)

## Error Handling
The API returns errors in the following format:
```json
{
  "code": 400,
  "message": "Error message",
  "stack": "..." // Only in development
}
```
