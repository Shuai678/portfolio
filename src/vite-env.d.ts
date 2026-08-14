/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANALYTICS_ENDPOINT?: string;
  readonly VITE_ANALYTICS_HOSTS?: string;
  readonly VITE_ANALYTICS_PATH_PREFIX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
