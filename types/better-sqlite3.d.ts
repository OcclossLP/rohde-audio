declare module "better-sqlite3" {
  type Statement = {
    all: (...args: unknown[]) => unknown[];
    get: (...args: unknown[]) => unknown;
    run: (...args: unknown[]) => unknown;
    pluck: (toggle?: boolean) => Statement;
  };

  type DatabaseInstance = {
    pragma: (...args: unknown[]) => unknown;
    exec: (sql: string) => unknown;
    prepare: (sql: string) => Statement;
    close: () => void;
  };

  export interface DatabaseConstructor {
    (path: string, options?: Record<string, unknown>): DatabaseInstance;
    new (path: string, options?: Record<string, unknown>): DatabaseInstance;
  }

  const Database: DatabaseConstructor;
  export default Database;
}
