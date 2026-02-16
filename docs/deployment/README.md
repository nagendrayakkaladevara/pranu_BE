# Deployment Guide

## Prerequisites

- Node.js >= 18
- MongoDB Database (e.g., MongoDB Atlas, local MongoDB)

## Build

```bash
npm run build
```

## Start

```bash
npm start
```

## Environment Variables

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Yes | — | MongoDB connection string |
| `JWT_SECRET` | Yes | — | Secret key for JWT signing |
| `PORT` | No | `3000` | Server port |
| `NODE_ENV` | No | `development` | `development`, `production`, or `test` |
| `JWT_ACCESS_EXPIRATION_MINUTES` | No | `30` | Access token lifetime in minutes |
| `JWT_REFRESH_EXPIRATION_DAYS` | No | `30` | Refresh token lifetime in days |

## Vercel Deployment

The project includes a `vercel.json` configuration for serverless deployment on Vercel. The server entry point handles both standalone and serverless modes.

## Production Notes

- **Rate limiting** is only active when `NODE_ENV=production`
- **Error stack traces** are only included in responses during development
- An admin user (`admin@admin.com` / `admin123`) is seeded on first startup
