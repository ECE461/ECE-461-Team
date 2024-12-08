import { Pool } from 'pg';
import { Logger } from './utils/Logger';
import { error } from 'console';
import { PackageMetadata } from './models/package/PackageMetadata';
import bcrypt from 'bcryptjs';

const salt: number = 10; //salt round: number of times to hash (adding "salt" haha)

export interface PackageDetails {
    name : string;
    readme?: string; 
    jsprogram?: string;
    version: string;
    githubURL?: string;
    uploadUrl?: string;
    user: string;
}


export interface PackageRow {
    id: string,
    version: string
}

/**
 * @class Database
 * @description Singleton that manages database instance and operations
 * 
 ** LOGISTICS
 * @private @method constructor: DO NOT USE. use getInstance instead
 * @method getInstance
 * @method initializePackageTable
 * @method initializeUsersTable
 * 
 ** PACKAGE TABLE
 *
 ** USERS TABLE
 * 
 */
export class Database {
    private static instance: Database;
    private pool: Pool;
  
    /**
     **LOGISTICS 
     * @private @method constructor: DO NOT USE. use getInstance instead
     * @method getInstance
     * @method initializePackageTable
     * @method initializeUsersTable
     * 
     */

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
        if (!(process.env.RESPONSE_TYPE === 'FAKE_SUCCESS')) {
            this.pool.connect()
                .then(() => Logger.logInfo('Connected to the PostgreSQL database.'))
                .catch((err: any) => {Logger.logError('Error connecting to the database:', err)});

            Logger.logInfo('Initializing the database...');

            Promise.all([
                this.initializePackageTable(), 
                this.initializeUsersTable(), 
                this.initializeTokensTable()
            ])
                .then(() => Logger.logInfo('Database Initialized.'))
                .catch((err: any) => {Logger.logError('Error initializing database:', err)})
        }

        
    }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }   
        return Database.instance;
    }


    private async initializePackageTable() {
        try {
            // Create "packages_table" table if it does not exist
            await this.pool.query(`CREATE TABLE IF NOT EXISTS packages_table (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                version TEXT NOT NULL,
                readme TEXT,
                url TEXT,
                jsprogram TEXT,
                uploadUrl TEXT,
                uploadUser TEXT
            )`);
            Logger.logInfo('Packages table created or already exists.');
        } catch (err: any) {
            throw err;
        }
    }

    private async initializeUsersTable(){
        try{
            await this.pool.query(`CREATE TABLE IF NOT EXISTS users (
                username TEXT PRIMARY KEY,
                is_admin BOOLEAN, 
                password TEXT
            )`);
            Logger.logInfo('Users table created or already exists.');
        } catch(err: any){
            throw new Error("error creating users table");
        }
    }

    private async initializeTokensTable(){
        try { 
            await this.pool.query(`CREATE TABLE IF NOT EXISTS token_calls (
                token TEXT PRIMARY KEY,
                calls_left INTEGER
            )`);

            Logger.logInfo('Token table created or already exists.');
        } catch (err: any) {
           
            throw new Error('error creating token_calls table');
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


    /**
     **PACKAGES_TABLE OPERATIONS 
     * @method addPackage
     * @method packageExists
     * @method packageExistsbyName
     * @method getPackageURL
     * @method deleteAllPackages: clears the table
     * @method deletePackagebyID: delete a singular package associated with an id
     * @method deletePackagebyName: delete all versions of a package (versions of a package can have same name, diff id)
     * @method getDetails: return all data fields associated with a package
     * @method getSourceType: return whether the package is a URL or Content
     * @method getVersions: return all versions of a package
     */

    public async addPackage(packageId: string, name: string, version: string, readme: string, url: string, jsprogram: string, uploadUrl: string, user: string) {
        const sql = `INSERT INTO packages_table (id, name, version, readme, url, jsprogram, uploadUrl, uploadUser) VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`;
        try {
            const res = await this.pool.query(sql, [packageId, name, version, readme, url, jsprogram, uploadUrl, user]);
            Logger.logInfo(`A new package has been inserted with id: ${packageId} by user: ${user}`);
        } catch (err: any) {
            Logger.logError(`Error inserting data with id=${packageId} into database: `, err.message);
        }
    }

    public async packageExists(packageId: string): Promise<boolean> {
        const sql = `SELECT COUNT(*) as count FROM packages_table WHERE id = $1`; // Use $1 for parameterized queries
        try {
            const res = await this.pool.query(sql, [packageId]); // Execute the query using pool
            if(res.rows.length === 0){
                Logger.logInfo(`No package found with id: ${packageId}`);
                return false;
            }
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
        const sql = `SELECT url FROM packages_table WHERE id = $1`;
        try {
            const res = await this.pool.query(sql, [packageId]);
            return res.rows[0].url;
        } catch (err: any) {
            console.error('Error getting package URL:', err.message);
            throw err;
        }
    }

    public async getPackageVersionsByName(packageName: string): Promise<PackageRow[]>
    {
        const sql = `SELECT id, version FROM packages_table WHERE name = $1 ORDER BY version DESC`;
        try {
            const res = await this.pool.query(sql, [packageName]);
            return res.rows;
        }
        catch (err: any) {
            console.error('Error getting package versions:', err.message);
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

    public async getAllPackageMetadata(): Promise<PackageMetadata[]> {
        const sql = `SELECT name, version FROM packages_table`;
        try {
            const res = await this.pool.query(sql);
            const allPackagesMetadata = res.rows.map((row: any) => new PackageMetadata(row.name, row.version));
            return allPackagesMetadata;
        } catch (err: any) {
            Logger.logError("500 Error fetching all package metadata", err.message);
            throw err;
        }
    }

    public async getPackagesByRegex(regex: string): Promise<PackageMetadata[]> {
        const sql = `
            SELECT name, version 
            FROM packages_table 
            WHERE readme ~* $1 OR name ~* $1
        `;
        try {
            const res = await this.pool.query(sql, [regex]);
    
            // If no rows are found, return an empty array
            if (res.rows.length === 0) {
                return [];
            }
    
            const allPackagesMetadata = res.rows.map((row: any) => new PackageMetadata(row.name, row.version));
            return allPackagesMetadata;
        } catch (err: any) {
            Logger.logError('Error fetching packages matching regex:', err.message);
            throw err;
        }
    }
    

    public async getDetails(packageID: string): Promise< PackageDetails | null>{
        const sql = `SELECT name, version, readme, url, jsprogram, uploadUrl, uploadUser FROM packages_table WHERE id = $1`;
        try{
            
            const res = await this.pool.query(sql, [packageID]);
            Logger.logDebug(`Fetched details associated with package ID: ${packageID}`);
            Logger.logDebug(`Number of rows fetched: ${res.rows.length}`);
            Logger.logDebug(`Raw data: ${res.rows}`);

            if (res.rows.length === 0) {
                Logger.logInfo(`No package found with id: ${packageID}`);
                throw new Error("404: Package does not exist");
                return null;
            }
            
            const fields = res.rows[0]; // Get the first row
            
            return {name: fields.name, version: fields.version, readme: fields.readme, githubURL: fields.url, jsprogram: fields.jsprogram, uploadUrl: fields.uploadUrl, user: fields.uploadUser};
        } catch(err: any){
            Logger.logError('Error fetching details associated with your package ID', err.message);
            throw err;
        }
    }

    public async getSourceType(packageID: string): Promise<string> {
        const sql = `SELECT uploadUrl FROM packages_table WHERE id = $1`;
        try {
            const res = await this.pool.query(sql, [packageID]);
            Logger.logDebug(res.rows);
            const uploadUrl = res.rows[0].uploadUrl;

            return uploadUrl === "" ? "Content" : "URL";
        } catch (err) {
            Logger.logError('Error fetching source type:', err);
            throw err;
        }
    }

    public async getVersions(packageName: string): Promise<string[]> {
        const sql = `SELECT version FROM packages_table WHERE name = $1`;
        try {
            const res = await this.pool.query<{ version: string }>(sql, [packageName]);
            return res.rows.map((row) => row.version);
        } catch (err: any) {
            Logger.logError('Error fetching versions:', err);
            throw err;
        }
    }


    /**
     **USERS TABLE 
     * @method userExists
     * @method addUser
     * @method deleteUser 
     * @method isAdmin
     * @method getPW
     * @method deleteAllUsers
     */

    public async userExists(username:string){
        const sql = 'SELECT COUNT(*) as count FROM users WHERE username = $1'; 
        
        try{

            const res = await this.pool.query(sql, [username]);
            Logger.logInfo(`User ${username} exists.`);
            
            return res.rows[0].count > 0;

        } catch(err: any) {

            Logger.logDebug(`User ${username} does not exist. `);
            throw err;

        }
    }

    public async addUser(username: string, is_admin: boolean, pw: string){
        let pw_hash = await bcrypt.hash(pw, salt);

        const sql = 'INSERT INTO users (username, is_admin, password) VALUES ($1, $2, $3)';

        try{

            const res = await this.pool.query(sql, [username, is_admin, pw_hash]);
            Logger.logInfo(`User ${username} has been registered.`)

        } catch(err: any){

            Logger.logError("500: Error registering user: ", err);
            throw err; 

        }
    }

    //figure out how to wrap this so you have to validate the user deleting. extra function mayhaps?
    public async deleteUser(username: string){
        const sql = 'DELETE FROM users WHERE username = $1'; 

        try{

            const res = await this.pool.query(sql, [username]);
            Logger.logInfo(`Deleting ${username} from database.`);

        } catch(err: any) {

            Logger.logError(`Error deleting ${username} from database:`, err);
            throw err;

        }
    }

    public async isAdmin(username: string){
        const sql = `SELECT is_admin FROM users WHERE username = $1`;

        try{  

            const res = await this.pool.query(sql, [username]);
            Logger.logInfo(`Fetching admin information for user ${username}.`);

            return res.rows[0].is_admin;

        } catch(err: any) {

            Logger.logError(`Error determining if user ${username} is an admin.`, error);
            throw err; 
        }
    }

    public async getPW(username: string){
        const sql = 'SELECT password FROM users WHERE username = $1';

        try{
            const res = await this.pool.query(sql, [username]);
            Logger.logInfo(`Fetching password for ${username}`);

            return res.rows[0].password;
        } catch (err: any) {
            
            Logger.logError(`Error fetching password for ${username}`, error); 
            throw err;
        }
    }
    
    public async deleteAllUsers() {
        // Delete all entries from users table except for user: 'ece30861defaultadminuser'
        const sql = `DELETE FROM users WHERE username != 'ece30861defaultadminuser'`;
        try {
            const res = await this.pool.query(sql);
            Logger.logInfo(`Deleted ${res.rowCount} entries from the users table.`);
        } catch (err: any) {
            Logger.logError('Error deleting entries:', err.message);
            throw err;
        }
    }

    /**
     * *TOKENS TABLE
     */

    public async addToken(token: string){
        const sql = `INSERT INTO token_calls (token, calls_left) VALUES ($1, $2)`; 

        try {
            const res = await this.pool.query(sql, [token, 1000]);
            Logger.logInfo(`Successfully inserted token into token_calls table.`)

        } catch(err: any) {
            Logger.logError(`Error inserting token into token_calls table`, err.message);
        }
    }

    public async deleteToken(token: string){
        const sql = `DELETE FROM token_calls WHERE token = $1`

        try {
            const res = await this.pool.query(sql, [token]);
            Logger.logInfo(`Deleting token ${token} from tokens_calls table.`);
        
        } catch(err: any) {
            Logger.logError("Error deleting entries: ",  err.message);
            throw err;
        }
    }

    public async decrementCalls(token: string){
        const sql = `UPDATE token_calls SET calls_left = calls_left - 1 WHERE token = $1`;

        try {
            
            await this.pool.query(sql, [token]); //no return values when updating values

        } catch (err: any) { 
            Logger.logError("Error updating API calls: ",  err.message);
            throw err;
        }
    }

    public async callsRemaining(token: string) {
        const sql = `SELECT calls_left FROM token_calls WHERE token = $1`;

        try { 
            
            const res = await this.pool.query(sql, [token]);
            
            return res.rows[0].calls_left;

        } catch (err: any) {
            Logger.logError("Error fetching calls remaining: ", err.message);
            throw err;
        }
    }

    public async tokenExists (token: string) {
        const sql = `SELECT COUNT(*) as count FROM token_calls WHERE token = $1`;

        try {
            const res = await this.pool.query(sql, [token]);

            return res.rows[0].count >-0; 
        } catch (err: any) {
            Logger.logError("Error checking token existence: ", err.message);
        }
    }


}
