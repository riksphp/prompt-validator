// Chrome Extension API type definitions
export {};

declare global {
  interface Window {
    chrome?: {
      storage?: {
        sync: {
          get: (
            keys: string | string[] | null,
            callback: (items: Record<string, unknown>) => void
          ) => void;
          set: (items: { [key: string]: any }, callback?: () => void) => void;
        };
        local: {
          get: (
            keys: string | string[] | null,
            callback: (items: Record<string, unknown>) => void
          ) => void;
          set: (items: { [key: string]: any }, callback?: () => void) => void;
        };
      };
      runtime?: {
        id?: string;
      };
    };
  }
}

// CSS Modules type declarations
declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "*.css" {
  const content: string;
  export default content;
}
