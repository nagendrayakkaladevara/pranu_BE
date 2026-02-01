# System Architecture

## Overview
This backend follows a layered architecture pattern (Controller-Service-Repository) ensuring separation of concerns.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma

## Directory Structure
- `src/controllers`: Handle HTTP requests.
- `src/services`: Business logic.
- `src/routes`: Route definitions.
- `src/middlewares`: Request processing (auth, validation, etc.).
