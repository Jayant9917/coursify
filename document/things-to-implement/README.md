# Things To Implement

This folder is a working map of the current Coursify blueprint.

Use these files when you want to pick one problem area and fix it without rereading the full document.

## Files

- [00-current-state.md](./00-current-state.md) - what works now, what is partial, what is missing
- [01-backend.md](./01-backend.md) - backend tasks, APIs, storage, security, scaling
- [02-frontend.md](./02-frontend.md) - frontend tasks, state, hooks, pages, bundle issues
- [03-integration.md](./03-integration.md) - backend/frontend contract gaps and cross-cutting fixes
- [04-priority-roadmap.md](./04-priority-roadmap.md) - recommended order to tackle work
- [05-todo-checklist.md](./05-todo-checklist.md) - simple checkbox list you can work through
- [06-bugs-to-fix.md](./06-bugs-to-fix.md) - only the broken or risky items
- [07-next-steps.md](./07-next-steps.md) - the best immediate next actions

## How to use this folder

1. Open the topic file for the problem you want to solve.
2. Find the matching section or task item.
3. Fix only that part first.
4. Recheck integration after changing anything that touches auth, checkout, uploads, or streaming.

## Working rule

- If the issue affects both backend and frontend, update the integration file too.
- If the issue affects file uploads, streaming, or security, treat it as a higher-priority task.
- If the issue is a quick bug fix, keep it local and do not rewrite unrelated code.
