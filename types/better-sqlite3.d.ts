declare module "better-sqlite3" {
  type DatabaseInstance = {
    pragma: (...args: any[]) => any;
    exec: (...args: any[]) => any;
    prepare: (...args: any[]) => any;
    close: (...args: any[]) => any;
  };

  export interface DatabaseConstructor {
    (path: string, options?: any): DatabaseInstance;
    new (path: string, options?: any): DatabaseInstance;
  }

  const Database: DatabaseConstructor;
  export default Database;
}
