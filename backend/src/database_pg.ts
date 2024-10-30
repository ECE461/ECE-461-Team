import { Pool } from 'pg';
import { Logger } from './utils/Logger';

/**
 * @class Database
 * @description Singleton that manages database instance and operations
 * 
 * @method getInstance: gets the singleton instance of the Database
 * @method addPackage: adds a new package to the database
 * @method packageExists: checks if a package exists in the database
 */
export class Database {
    private static instance: Database;
    private pool: Pool;
    
    private constructor() {
        this.pool = new Pool({
            user: `${process.env.RDS_USER}`,
            password: `${process.env.RDS_KEY}`,
            host: `${process.env.RDS_HOST}`, // localhost for LOCAL development, 'ece461-db.cvwo68cu081c.us-east-2.rds.amazonaws.com' for EC2
            port: 5432,
            database: 'packages',
            ssl: {
                rejectUnauthorized: false // Change to true in production for better security
            }
        });
        Logger.logInfo('Starting connection to the PostgreSQL database...');
        Logger.logInfo(`${process.env.RDS_USER}`);
        Logger.logInfo(`${process.env.RDS_KEY}`);
        Logger.logInfo(`${process.env.RDS_HOST}`);

        // Optionally test the connection immediately
        this.pool.connect()
            .then(() => console.log('Connected to the PostgreSQL database.'))
            .catch((err: any) => Logger.logDebug('Error connecting to the database:'+ err));

        Logger.logInfo('Initializing the database...');
        this.initialize()
            .then(() => console.log('Database initialized.'))
            .catch((err: any) => console.error('Error initializing the database:', err));
    }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    private async initialize() {
        try {
            // Create "packages" table if it does not exist
            await this.pool.query(`CREATE TABLE IF NOT EXISTS packages (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                version TEXT NOT NULL,
                readme TEXT,
                url TEXT
            )`);
            Logger.logInfo('Packages table created or already exists.');
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

    public async getPackageURL(packageId: string): Promise<string> {
        const sql = `SELECT url FROM packages WHERE id = $1`;
        try {
            const res = await this.pool.query(sql, [packageId]);
            return res.rows[0].url;
        } catch (err: any) {
            console.error('Error getting package URL:', err.message);
            throw err;
        }
    }

    public async deleteAllPackages() {
        
        // Delete all entries from the "packages" table
        const sql = `DELETE FROM packages`;
        try {
            const res = await this.pool.query(sql);
            console.log(`Deleted ${res.rowCount} entries from the packages table.`);
        } catch (err: any) {
            console.error('Error deleting entries:', err.message);
            throw err;
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
