import { Task, Category, Note } from '../types';

const DB_NAME = 'CafePlannerDB';
const DB_VERSION = 1;

export const DB = {
  // Open Database
  open: (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create Object Stores if they don't exist
        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('notes')) {
          db.createObjectStore('notes', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // Delete Database (Reset App)
  deleteDatabase: async (): Promise<void> => {
     // We must close any open connections before deleting, 
     // but since we close them in operations below, it should be fine.
     return new Promise((resolve, reject) => {
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        req.onblocked = () => {
            console.warn("Deletion blocked by open connections. Reloading...");
            window.location.reload();
        };
     });
  },

  // Generic Get All
  getAll: async <T>(storeName: string): Promise<T[]> => {
    const db = await DB.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
          resolve(request.result || []);
          db.close(); // Close connection
      };
      request.onerror = () => {
          reject(request.error);
          db.close(); // Close connection
      };
    });
  },

  // Generic Put (Insert/Update)
  put: async (storeName: string, item: any): Promise<void> => {
    const db = await DB.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => {
          resolve();
          db.close(); // Close connection
      };
      request.onerror = () => {
          reject(request.error);
          db.close(); // Close connection
      };
    });
  },

  // Generic Bulk Put (for seeding)
  bulkPut: async (storeName: string, items: any[]): Promise<void> => {
    const db = await DB.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      items.forEach(item => store.put(item));

      transaction.oncomplete = () => {
          resolve();
          db.close(); // Close connection
      };
      transaction.onerror = () => {
          reject(transaction.error);
          db.close(); // Close connection
      };
    });
  },

  // Generic Delete
  delete: async (storeName: string, id: string): Promise<void> => {
    const db = await DB.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
          resolve();
          db.close(); // Close connection
      };
      request.onerror = () => {
          reject(request.error);
          db.close(); // Close connection
      };
    });
  },

  // Specific Helpers
  tasks: {
    getAll: () => DB.getAll<Task>('tasks'),
    put: (task: Task) => DB.put('tasks', task),
    delete: (id: string) => DB.delete('tasks', id),
    seed: (tasks: Task[]) => DB.bulkPut('tasks', tasks)
  },
  categories: {
    getAll: () => DB.getAll<Category>('categories'),
    put: (category: Category) => DB.put('categories', category),
    delete: (id: string) => DB.delete('categories', id),
    seed: (categories: Category[]) => DB.bulkPut('categories', categories)
  },
  notes: {
    getAll: () => DB.getAll<Note>('notes'),
    put: (note: Note) => DB.put('notes', note),
    delete: (id: string) => DB.delete('notes', id)
  }
};
