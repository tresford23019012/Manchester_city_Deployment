# MVC mapping

- **Model:** `src/models/services/w3` (API adapters/mock implementations/data types), `src/models/utils`, `src/features/guesthouses/models` (guesthouse shape and storage, image service).
- **View:** `src/views/pages`, `src/views/components`, and `src/features/guesthouses/views` (React components, CSS, forms).
- **Controller:** `src/controllers` (React data-fetching/controller hooks).
- **Router/composition:** `src/App.tsx`.

React is not traditional server-side MVC. Several original views still contain local UI state and mutation handlers, especially the large guesthouse management page. That feature should be migrated toward controller hooks when real backend endpoints are agreed; it has not been represented as a complete MVC conversion.

**No backend endpoints were invented.** Original mock/local storage behavior remains explicit.
