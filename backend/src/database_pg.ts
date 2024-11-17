import { Pool } from 'pg';
import { Logger } from './utils/Logger';
import { error } from 'console';

export interface PackageDetails {
    name : string;
    readme?: string; 
    jsprogram?: string
}

/**
 * @class Database
 * @description Singleton that manages database instance and operations
 * 
 * @method getInstance: gets the singleton instance of the Database
 * @method addPackage: adds a new package to the database
 * @method packageExists: checks if a package exists in the database
 * @method deleteAllPackages: delete all entries form the packages_table table 
 * @method deletePackage: delete a package from packages_table table through id
 * @method getDetails: @returns {PackageDetails} associated with an id
 * @method getID: converts the name of repository to its id
 * @method close: close the instance
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

        // Optionally test the connection immediately
        this.pool.connect()
            .then(() => Logger.logInfo('Connected to the PostgreSQL database.'))
            .catch((err: any) => {Logger.logError('Error connecting to the database:', err)});

        Logger.logInfo('Initializing the database...');
        this.initialize()
            .then(() => Logger.logInfo('Database initialized.'))
            .catch((err: any) => {Logger.logError('Error initializing the database:', err)});
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
            await this.pool.query(`CREATE TABLE IF NOT EXISTS packages_table (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                version TEXT NOT NULL,
                readme TEXT,
                url TEXT,
                jsprogram TEXT
            )`);
            Logger.logInfo('Packages table created or already exists.');
        } catch (err: any) {
            Logger.logError('Error creating table:', err);
        }
    }

    public async addPackage(packageId: string, name: string, version: string, readme: string, url: string, jsprogram: string) {
        const sql = `INSERT INTO packages_table (id, name, version, readme, url, jsprogram) VALUES ($1, $2, $3, $4, $5, $6)`;
        try {
            const res = await this.pool.query(sql, [packageId, name, version, readme, url, jsprogram]);
            Logger.logInfo(`A new package has been inserted with id: ${packageId}`);
        } catch (err: any) {
            Logger.logError(`Error inserting data with id=${packageId} into database: `, err.message);
        }
    }

    public async packageExists(packageId: string): Promise<boolean> {
        const sql = `SELECT COUNT(*) as count FROM packages_table WHERE id = $1`; // Use $1 for parameterized queries
        try {
            const res = await this.pool.query(sql, [packageId]); // Execute the query using pool
            return res.rows[0].count > 0; // Check if count is greater than 0
        } catch (err: any) {
            Logger.logError('Error checking package existence:', err.message);
            throw err; // Rethrow the error for further handling if needed
        }
    }

    public async packageExistsbyName(packageName: string): Promise<boolean> {

        const sql = `SELECT COUNT(*) as count FROM packages_table WHERE name = $1`; // Use $1 for parameterized queries
        try {
            
            const res = await this.pool.query(sql, [packageName]); // Execute the query using pool

            return res.rows[0].count > 0; // Check if count is greater than 0
        } catch (err: any) {
            Logger.logDebug('Error checking package existence:' + err.message);
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
        
        // Delete all entries from the "packages_table" table
        const sql = `DELETE FROM packages_table`;
        try {
            const res = await this.pool.query(sql);
            Logger.logInfo(`Deleted ${res.rowCount} entries from the packages_table table.`);
        } catch (err: any) {
            Logger.logError('Error deleting entries:', err.message);
            throw err;
        }
    }

    public async deletePackagebyID(packageID: string){
        const sql = `DELETE FROM packages_table WHERE id=$1`
        try{
            const res = await this.pool.query(sql, [packageID]);
            Logger.logInfo(`Deleted ${packageID} from packages_table database`)
            
        } catch(err: any){
            Logger.logDebug(`Error deleting ${packageID}`+ err.message); 
            throw err; 
        }
    }

    public async deletePackagebyName(packageName: string){

        const sql = `SELECT id from packages_table WHERE name=$1`;

        try{
            const res = await this.pool.query(sql, [packageName]);

            if(!res){return null;}
            
            res.rows.forEach(async(row) => {

                await this.deletePackagebyID(row.id);
            
            })
            
            Logger.logDebug(`${res.rows.length} rows have been deleted from the database.`)
            return res.rows; 

        }catch(err:any){
            console.error("Error fetching package ID from given package name", err.message);
            throw err;
        }
    }

    /**
     * 
     * @param packageID 
     * @returns {Promise<{PackageDetails} | null>}: return null if package details if empty
     *                                              current implementation requires user to check whether or not the fields are empty. 
     */
    public async getDetails(packageID: string): Promise< PackageDetails | null>{
        const sql = `SELECT (name, version, readme, url, jsprogram) FROM packages_table WHERE id = $1`;
        try{
            
            const res = await this.pool.query(sql, [packageID]);

            if (!res) {
                return null;
            }
            
            const cleanedRow :string = res.rows[0].row.slice(1, -1);
            //consider implementing a check to see which fields are left blank and whether or not to return null;
            const regex = /(?:,|\s)+(?=(?:[^"]|"[^"]*")*[^"]*$)/g;
  
            // Split the string using the regex
            const fields = cleanedRow.split(regex).map(field => field.trim());
            
            return {name: fields[0], readme: fields[1], jsprogram: fields[4]};
            // return [fields[0], fields[1], fields[4]];

        } catch(err: any){
            Logger.logError('Error fetching details associated with your package ID', err.message);
            throw err;
        }
    }

    public async close() {
        try {
            await this.pool.end();
            Logger.logInfo('Closed the database connection.');
        } catch (err: any) {
            Logger.logDebug('Error closing the database connection:' + err.message);
        }
    }
}
