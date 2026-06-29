# React + Vite

## Proctored Exam Fullscreen Flow

The online proctored exam runs in the user's normal browser. When the exam starts, the app requests fullscreen, blocks keyboard/input events during the live attempt, hides the in-app exit action, and shows a solid lock screen if fullscreen is interrupted.

A normal browser page cannot disable OS-level close, task switching, or browser-owned fullscreen controls. If stronger restriction is required later, use Safe Exam Browser, kiosk mode, or a managed Windows assigned-access account outside this React app.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
