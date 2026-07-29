# Frontend Tasks

This file groups the frontend work by area so you can jump straight to the part that needs attention.

## 1. App structure

- [ ] Keep route definitions centralized in `src/routes/index.jsx`.
- [ ] Keep auth bootstrap in `src/App.jsx`.
- [ ] Keep server state in React Query, not in random component state.
- [ ] Keep global auth state in Zustand.

## 2. State management

- [ ] Use Zustand only for auth-related shared state.
- [ ] Use React Query for data loaded from the backend.
- [ ] Use local component state only for UI details like tabs, inputs, and modals.
- [ ] Invalidate queries after mutations so the UI stays in sync.

## 3. Hooks

- [ ] Keep API wrappers inside custom hooks.
- [ ] Reuse hooks across pages instead of duplicating fetch logic.
- [ ] Keep checkout workflow logic inside `useCheckout`.
- [ ] Keep role-specific data access inside role-aware hooks.

## 4. Pages

- [ ] Keep public pages focused on discovery and auth.
- [ ] Keep student pages focused on learning and tracking.
- [ ] Keep instructor pages focused on course creation and stats.
- [ ] Keep admin pages focused on management tasks.

## 5. Checkout

- [ ] Keep coupon validation UI on the checkout page.
- [ ] Keep order placement in one workflow.
- [ ] Keep retry behavior for enrollments after order placement.
- [ ] Make sure backend and frontend agree on coupon response shape.

## 6. Course and lesson rendering

- [ ] Review all `dangerouslySetInnerHTML` usage.
- [ ] Sanitize any HTML content before rendering.
- [ ] Keep lesson player behavior clear for preview vs locked content.

## 7. Bundle and performance

- [ ] Split heavy screens like `CourseEditor` if bundle size becomes a problem.
- [ ] Avoid pulling unnecessary data on pages that only need summaries.
- [ ] Keep image and media loading lightweight with placeholders.

## 8. UI components

- [ ] Keep reusable UI in `src/components/ui`.
- [ ] Keep layout UI in `src/components/layout`.
- [ ] Keep generic utility UI in `src/components/common`.

## 9. Suggested frontend file hotspots

- [Frontend/src/services/api.js](../Frontend/src/services/api.js)
- [Frontend/src/store/authStore.js](../Frontend/src/store/authStore.js)
- [Frontend/src/hooks/useCheckout.js](../Frontend/src/hooks/useCheckout.js)
- [Frontend/src/hooks/useCourses.js](../Frontend/src/hooks/useCourses.js)
- [Frontend/src/hooks/useEnrollments.js](../Frontend/src/hooks/useEnrollments.js)
- [Frontend/src/components/common/SearchBar.jsx](../Frontend/src/components/common/SearchBar.jsx)
- [Frontend/src/components/layout/Navbar.jsx](../Frontend/src/components/layout/Navbar.jsx)
- [Frontend/src/pages/public/Checkout.jsx](../Frontend/src/pages/public/Checkout.jsx)
- [Frontend/src/pages/instructor/CourseEditor.jsx](../Frontend/src/pages/instructor/CourseEditor.jsx)
