# React + Vite

## Proctored Exam Kiosk Launch

Use Microsoft Edge kiosk mode for the online proctored exam when students must not reach normal browser tabs, address bar, close/exit controls, bookmarks, or navigation buttons. The proctored page allows start only when opened from the kiosk launcher.

Double-click:

```text
launch-proctored-kiosk.bat
```

Or run the Edge kiosk launcher:

```bash
npm run kiosk:exam
```

To install a desktop shortcut on a lab machine:

```bash
npm run kiosk:install
```

Chrome is available only as a fallback for local testing:

```bash
npm run kiosk:exam:chrome
```

To launch a different exam URL:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/launch-proctored-kiosk.ps1 -ExamUrl "https://your-site/my-assessment/online-proctored-exam"
```

The launcher automatically appends `kiosk=1` to the URL. Opening the same page manually in a normal browser window will keep the Start button disabled.

From the deployed app, non-kiosk browsers generate and download `install-proctored-launcher.bat`. The browser cannot run it automatically; a user or admin must open it once. When opened, it creates the desktop shortcut and starts Microsoft Edge kiosk mode immediately.

Edge kiosk mode removes the normal browser tabs/address bar from the student view. A normal React page cannot disable OS-level close/task switching by itself; for stricter control, run this from a managed Windows kiosk or assigned-access student account.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
