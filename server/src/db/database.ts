import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || path.resolve(__dirname, '../../aicte_flowx.db');
const schemaPath = path.resolve(__dirname, 'schema.sql');

let rawDb: SqlJsDatabase | null = null;
let saveTimer: NodeJS.Timeout | null = null;

function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveDatabase();
    saveTimer = null;
  }, 100);
}

export function saveDatabase() {
  if (!rawDb) return;
  try {
    const data = rawDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (err) {
    console.error('[DB] Error persisting database file:', err);
  }
}

export async function getDatabase(): Promise<SqlJsDatabase> {
  if (rawDb) return rawDb;

  const SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    rawDb = new SQL.Database(fileBuffer);
    console.log('[DB] Loaded existing SQLite database from:', dbPath);
  } else {
    rawDb = new SQL.Database();
    console.log('[DB] Created fresh in-memory SQLite database. Initializing schema...');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      rawDb.run(schemaSql);
      saveDatabase();
      console.log('[DB] Initial schema applied successfully.');
    }
  }

  return rawDb;
}

export const db = {
  async queryAll<T = any>(sql: string, params: Record<string, any> | any[] = {}): Promise<T[]> {
    const database = await getDatabase();
    const stmt = database.prepare(sql);
    try {
      if (Array.isArray(params)) {
        stmt.bind(params);
      } else {
        const namedParams: Record<string, any> = {};
        for (const [k, v] of Object.entries(params)) {
          namedParams[k.startsWith(':') || k.startsWith('@') || k.startsWith('$') ? k : `@${k}`] = v;
        }
        stmt.bind(namedParams);
      }

      const results: T[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject() as T);
      }
      return results;
    } finally {
      stmt.free();
    }
  },

  async queryOne<T = any>(sql: string, params: Record<string, any> | any[] = {}): Promise<T | null> {
    const rows = await this.queryAll<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  },

  async run(sql: string, params: Record<string, any> | any[] = {}): Promise<{ changes: number }> {
    const database = await getDatabase();
    const stmt = database.prepare(sql);
    try {
      if (Array.isArray(params)) {
        stmt.bind(params);
      } else {
        const namedParams: Record<string, any> = {};
        for (const [k, v] of Object.entries(params)) {
          namedParams[k.startsWith(':') || k.startsWith('@') || k.startsWith('$') ? k : `@${k}`] = v;
        }
        stmt.bind(namedParams);
      }
      stmt.step();
      const changes = database.getRowsModified();
      scheduleSave();
      return { changes };
    } finally {
      stmt.free();
    }
  },

  async exec(sql: string): Promise<void> {
    const database = await getDatabase();
    database.run(sql);
    scheduleSave();
  }
};

export default db;
