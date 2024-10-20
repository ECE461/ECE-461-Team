import { Pool, Client } from 'pg';
import { Logger } from './utils/Logger';

export class Database {
    private static instance: Database;
    private pool: Pool;
    
    private constructor() {
        if (!process.env.RDS_USER || !process.env.RDS_KEY) {
            throw new Error('RDS_USER and RDS_KEY must be defined');
        }
        const databaseUrl = `postgres://${process.env.RDS_USER}:${process.env.RDS_KEY}@ece461-db.cvwo68cu081c.us-east-2.rds.amazonaws.com:5432/ece461-db`;

        this.pool = new Pool({
            user: 'ece461',
            password: `${process.env.RDS_KEY}`,
            host: 'ece461-db.cvwo68cu081c.us-east-2.rds.amazonaws.com',
            port: 5432,
            database: 'ece461-db'
        });
        Logger.logInfo('Starting connection to the PostgreSQL database...');
        // Optionally test the connection immediately
        this.pool.connect()
            .then(() => console.log('Connected to the PostgreSQL database.'))
            .catch((err: any) => console.error('Error connecting to the database:', err.message));

        Logger.logInfo('Initializing the database...');
        this.initialize()
            .then(() => console.log('Database initialized.'))
            .catch((err: any) => console.error('Error initializing the database:', err.message));
    }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    private async initialize() {
        try {
            console.log('CREATING TABLES...');
            await this.pool.query(`CREATE TABLE IF NOT EXISTS packages (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                version TEXT NOT NULL,
                readme TEXT,
                url TEXT
            )`);
            console.log('Packages table created or already exists.');
        } catch (err: any) {
            console.error('Error creating table:', err.message);
        }
    }

    public async addPackage(packageId: string, name: string, version: string, readme: string, url: string) {
        const sql = `INSERT INTO packages (id, name, version, readme, url) VALUES ($1, $2, $3, $4, $5)`;
        try {
            const res = await this.pool.query(sql, [packageId, name, version, readme, url]);
            console.log(`A new package has been inserted with id: ${packageId}`);
        } catch (err: any) {
            console.error('Error inserting data:', err.message);
        }
    }

    public async packageExists(packageId: string): Promise<boolean> {
        const sql = `SELECT COUNT(*) as count FROM packages WHERE id = $1`; // Use $1 for parameterized queries
        try {
            const res = await this.pool.query(sql, [packageId]); // Execute the query using pool
            return res.rows[0].count > 0; // Check if count is greater than 0
        } catch (err: any) {
            console.error('Error checking package existence:', err.message);
            throw err; // Rethrow the error for further handling if needed
        }
    }

    public async close() {
        try {
            await this.pool.end();
            console.log('Closed the database connection.');
        } catch (err: any) {
            console.error('Error closing the database connection:', err.message);
        }
    }
}
