# Development Guides

## Coding Standards
- We use ESLint and Prettier. Run `npm run lint` and `npm run format` before committing.
- Follow the existing project structure.

## Database Migrations
- Modify `prisma/schema.prisma`.
- Run `npx prisma db push` (for prototyping) or `npx prisma migrate dev` (for production history).

## Testing
(To be added)
