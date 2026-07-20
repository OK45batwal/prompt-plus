import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "dev.db"));
db.pragma("journal_mode = WAL");

export default db;
