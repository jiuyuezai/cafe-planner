// Fix: Comment out vite/client reference as the type definition cannot be resolved in the current environment
// /// <reference types="vite/client" />

interface Window {
  // expose the API to renderer
}

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;