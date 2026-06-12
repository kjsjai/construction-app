# Construction App

On-premise and a Web based app to record and track expense for home construction.

## Stack

| Layer       | Technology                                                  |
|-------------|-------------------------------------------------------------|
| Frontend    | Next.js 15 (App Router, RSC) · React 19 · Shadcn UI · Tailwind · Recharts · TanStack Query · next-themes · Socket.IO client. Lives in frontend/ folder |
| Backend     | NestJS 10 · Prisma 5 · Pino · Socket.IO · Passport JWT · class-validator · Helmet · Throttler |
| Database    | PostgreSQL 14+localhost only)            |
| Process mgr | PM2 (no Docker)                                             |

## UI/UX & Design Patterns

The frontend adheres to an enterprise-grade, high-contrast design:
1. **Compact Datatables**: All list views use compacted datatables without horizontal scrolling, featuring sticky headers.
2. **Column Visibility & Sorting**: Uses custom hooks (`useTable`) and components (`SortableHeader`, `ColumnVisibilityDropdown`) to allow users to toggle columns and sort data.
3. **Modal Edits**: All creation and edit actions must be handled via modal popups (`fixed inset-0`) rather than inline editing or page navigation to maintain context.
4. **Shadcn UI & Tailwind**: Leveraging Radix UI primitives with a customized Tailwind theme (dark/light mode via `next-themes`).