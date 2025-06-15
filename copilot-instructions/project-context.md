## Project Context

### Domain & Purpose

- **New Smell** is a perfume management and discovery application that allows users to browse, collect, and organize their favorite fragrances.
- The app manages perfumes, perfume houses (brands), user collections, wishlists, and provides perfume discovery features.
- Users can browse perfumes, add them to their personal collection or wishlist, and view detailed information about each fragrance.

### Technology Stack

- **Frontend Framework**: React for server-side rendering and routing (React Router)
- **Styling**: Tailwind CSS with Class Variance Authority (CVA) for component variants
- **State Management**: Zustand for global state (recently migrated from custom hooks)
- **Database**: Prisma ORM with PostgreSQL
- **Build Tools**: Vite for development and bundling
- **Testing**: Vitest with React Testing Library
- **Documentation**: Storybook for component library documentation
- **Language**: TypeScript throughout with strict typing

### Architecture Principles

- **Modular and maintainable** design with focus on **user experience**, **performance**, and **developer ergonomics**
- **Atomic Design principles**: Components organized as Atoms, Molecules, Organisms, and Containers
- **Separation of concerns**:
  - **Routes** handle page-level logic and layouts, using shared loaders for authentication
  - **Components** are reusable UI elements with co-located tests and stories
  - **Models** handle database operations and business logic
  - **Stores** manage global state using Zustand (replacing custom hooks)
  - **Utils** contain pure functions and helpers organized by feature area
- **Utility-first styling** at component level with Tailwind CSS

### Technical Configuration

- **Module System**: ES2022 with strict TypeScript configuration
- **Path Mapping**: `~/` alias for app directory structure
- **SSR**: Enabled through Remix architecture
- **Environment**: Modern browsers with DOM APIs and ES2017+ features
- **Authentication**: Session-based authentication with shared loaders

### Data Flow Patterns

- **State Architecture**: Zustand stores for client state (modal management, etc.)
- **Form Handling**: Form data with React state and Remix actions
- **Data Persistence**: Prisma ORM for database operations
- **Error Handling**: Centralized error boundaries with user-friendly messaging

### Component Architecture Patterns

- **Styling Strategy**: CVA (Class Variance Authority) for component variants with Tailwind utilities
- **Component Props**: TypeScript interfaces with strict typing for props validation
- **Modal Management**: Zustand store for modal state with document overflow and focus trap management
- **Accessibility**: ARIA compliance with proper focus management for modals

### Testing Strategy

- **Unit Tests**: Test cases with good coverage across components and utilities
- **Integration Tests**: React Testing Library for component interaction testing
- **Visual Testing**: Storybook stories for components with interaction testing

### Key Features & Domains

- **Perfume Management**: Browse, search, and view detailed perfume information
- **Perfume Houses**: Information about perfume brands and their collections
- **User Collections**: Personal collection of perfumes ("My Scents") with add/remove functionality
- **Wishlist**: User wishlist of perfumes they want to acquire
- **User Authentication**: Login/logout functionality with session management
- **Admin Interface**: Management interface for administrators

### Development Workflow

- **Component Generator**: Automated scaffolding for new components with templates
- **Hot Reloading**: Fast development experience with Vite
- **Type Safety**: Comprehensive TypeScript coverage with strict configuration
- **Linting & Formatting**: ESLint with strict rules

## Component Organization

- **Atomic Design**: Components placed in `Atoms/`, `Molecules/`, `Organisms/`, or `Containers/` based on complexity
- **Co-location**: Tests and variants files alongside components
- **Hooks**: Custom hooks for reusable logic
- **Stores**: Zustand stores for state management (e.g., ModalStore for modal state)
- **Routes**: Domain-specific folders (`admin/`, `login/`, etc.)
- **Models**: Server-side logic for database operations
- **Utils**: Shared utilities including loaders for authentication

## Recent Features & Implementations

### User Perfume Collection ("My Scents")

- Implemented a user perfume collection page at `/admin/my-scents`
- Created model functions for managing user perfumes (get, add, remove)
- Implemented loader and action functions with shared authentication
- UI displays user's collection with remove functionality and allows adding new perfumes

### Modal State Management Refactoring

- Migrated from custom React hook (`useModal`) to Zustand store (`ModalStore`)
- Implemented document overflow handling to prevent background scrolling when modals are open
- Added focus trapping for accessibility in modals
- Provides centralized state management for all modals in the application

## Change Logging

- Each significant feature or refactoring should be documented in the project context
- Document architecture decisions and their rationales
- Note migrations from custom solutions to library-based approaches (e.g., custom hooks to Zustand)
