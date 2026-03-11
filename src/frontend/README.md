# Frontend Overview

This frontend is a React app built with Vite.

## How the files work together

The app starts from `index.html`, then loads `main.jsx`, which renders `App.jsx`.

`App.jsx` controls routing and chooses which page to show (`Login` or `CreateAccount`) based on the URL.

`Login.jsx` and `CreateAccount.jsx` are the two form pages. They manage input with React state and move between pages using React Router links/navigation.

`index.css` provides shared styling used by both pages so the UI looks consistent.

## File-by-file summary

### `index.html`
- Base HTML file for the app.
- Contains `<div id="root"></div>` where React mounts.
- Loads `src/main.jsx`.

### `src/main.jsx`
- Entry point for React.
- Imports global styles from `index.css`.
- Wraps the app in `BrowserRouter` so route-based navigation works.
- Renders `<App />` into `#root`.

### `src/App.jsx`
- Defines app routes.
- Redirects `/` to `/login`.
- Maps `/login` to `Login.jsx`.
- Maps `/create-account` to `CreateAccount.jsx`.

### `src/Login.jsx`
- Login page component.
- Uses `useState` for `userid`, `password`, and `error`.
- Validates that fields are not empty before submit.
- Shows placeholder login behavior (console log + alert).
- Includes a link to the create account page.

### `src/CreateAccount.jsx`
- Create account page component.
- Uses `useState` for `userid`, `password`, `confirmPassword`, and `error`.
- Validates required fields.
- Validates password and confirm password match.
- Shows placeholder create-account behavior (console log + alert).
- Navigates back to `/login` after success.

### `src/index.css`
- Global and shared form styling.
- Centers the form card on the page.
- Styles inputs, buttons, links, and error messages.

## Current behavior note

Login and account creation are currently placeholders on the frontend.

Backend API calls are marked with TODO comments and are not connected yet.
