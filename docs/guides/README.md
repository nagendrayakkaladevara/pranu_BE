# Development & Contribution Guide

## Getting Started

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Environment Setup**
   Ensure `.env` contains:

   ```env
   DATABASE_URL="postgresql://..."
   JWT_SECRET="secret"
   ```

3. **Database Migration**
   Sync schema with the database:

   ```bash
   npx prisma db push
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## Workflow

1. **New Feature**:
   - Create **Validation Schema** using Zod in `src/validations`.
   - Create **Service** method in `src/services`.
   - Create **Controller** in `src/controllers` using `catchAsync`.
   - Define **Route** in `src/routes` and add to `index.ts`.

2. **Code Quality**:
   - Run `npm run lint` to check for issues.
   - Run `npm run format` to auto-format code using Prettier.

## Testing (Manual)

- Use Postman or Thunder Client.
- Authenticate via `/v1/auth/login` to get token.
- Add `Authorization: Bearer <token>` to headers for protected routes.
