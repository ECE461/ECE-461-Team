import sqlite3 from 'sqlite3';
import path from 'path';

export class Database {
    private static instance: Database;
    private db: sqlite3.Database;

    private constructor(databaseName: string) {
        databaseName = path.resolve(__dirname, databaseName);
        this.db = new sqlite3.Database(databaseName, (err) => {
            if (err) {
                console.error('Error connecting to the database:', err.message);
            } else {
                console.log('Connected to the packages database.');
                this.initialize();
            }
        });
    }

    public static getInstance(databaseName: string): Database {
        if (!Database.instance) {
            Database.instance = new Database(databaseName);
        }
        return Database.instance;
    }

    private initialize() {
        this.db.run(`CREATE TABLE IF NOT EXISTS packages (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            version TEXT NOT NULL,
            readme TEXT,
            url TEXT
        )`, (err) => {
            if (err) {
                console.error('Error creating table:', err.message);
            } else {
                console.log('Packages table created or already exists.');
            }
        });
    }

    public addPackage(packageId: string, name: string, version: string, readme: string, url: string) {
        const sql = `INSERT INTO packages (id, name, version, readme, url) VALUES (?, ?, ?, ?, ?)`;

        this.db.run(sql, [packageId, name, version, readme, url], function (err) {
            if (err) {
                console.error('Error inserting data:', err.message);
            } else {
                console.log(`A new package has been inserted with id: ${this.lastID}`);
            }
        });
    }

    public close() {
        this.db.close((err) => {
            if (err) {
                console.error('Error closing the database connection:', err.message);
            }
            console.log('Closed the database connection.');
        });
    }

    public async packageExists(packageId: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const sql = `SELECT COUNT(*) as count FROM packages WHERE id = ?`;
            this.db.get(sql, [packageId], (err, row: any) => {
                if (err) {
                    console.error('Error checking package existence:', err.message);
                    reject(err);
                } else {
                    resolve(row.count > 0);
                }
            });
        });
    }
}