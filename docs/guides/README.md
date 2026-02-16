# Development & Contribution Guide

## Getting Started

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file with:

   ```env
   DATABASE_URL="mongodb+srv://..."
   JWT_SECRET="your-secret-key"
   JWT_ACCESS_EXPIRATION_MINUTES=30
   JWT_REFRESH_EXPIRATION_DAYS=30
   NODE_ENV=development
   PORT=3000
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

   An admin user (`admin@admin.com` / `admin123`) is automatically seeded on first startup.

## Workflow

1. **New Feature**:
   - Create **Validation Schema** using Zod in `src/validations`
   - Create **Service** method in `src/services`
   - Create **Controller** in `src/controllers` using `catchAsync`
   - Define **Route** in `src/routes/v1` and register in `src/routes/index.ts`

2. **New Model**:
   - Create Mongoose schema and interface in `src/models`
   - Add `toJSON` transform to clean responses (`_id` -> `id`, remove `__v`)

3. **Code Quality**:
   - Run `npm run lint` to check for issues
   - Run `npm run lint:fix` to auto-fix lint errors
   - Run `npm run format` to auto-format code using Prettier

## Key Patterns

- **Error Handling**: Throw `ApiError` from services. The error middleware chain (`errorConverter` -> `errorHandler`) handles the rest.
- **Auth**: Use `auth('ROLE1', 'ROLE2')` middleware on routes. User attached to `req.user`.
- **Validation**: Export Zod schemas as `{ body, params, query }` objects. The `validate` middleware handles parsing.
- **Soft Deletes**: Users are soft-deleted (`isDeleted: true`). All queries filter deleted users automatically.
- **Refresh Tokens**: Stored in the `Token` model. Deleted on logout, rotated on refresh.

## Testing (Manual)

- Use Postman — import `docs/postman_collection.json`
- Authenticate via `/v1/auth/login` to get tokens
- Add `Authorization: Bearer <access_token>` to headers for protected routes
- Use the refresh token to get new tokens when access expires
