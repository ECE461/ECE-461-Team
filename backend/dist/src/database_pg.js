"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const pg_1 = require("pg");
const Logger_1 = require("./utils/Logger");
/**
 * @class Database
 * @description Singleton that manages database instance and operations
 *
 * @method getInstance: gets the singleton instance of the Database
 * @method addPackage: adds a new package to the database
 * @method packageExists: checks if a package exists in the database
 * @method deleteAllPackages: delete all entries form the packages table
 * @method close: close the instance
 */
class Database {
    constructor() {
        this.pool = new pg_1.Pool({
            user: `${process.env.RDS_USER}`,
            password: `${process.env.RDS_KEY}`,
            host: `${process.env.RDS_HOST}`,
            port: 5432,
            database: 'packages',
            ssl: {
                rejectUnauthorized: false // Change to true in production for better security
            }
        });
        Logger_1.Logger.logInfo('Starting connection to the PostgreSQL database...');
        // Optionally test the connection immediately
        this.pool.connect()
            .then(() => console.log('Connected to the PostgreSQL database.'))
            .catch((err) => console.error('Error connecting to the database:', err.message));
        Logger_1.Logger.logInfo('Initializing the database...');
        this.initialize()
            .then(() => console.log('Database initialized.'))
            .catch((err) => console.error('Error initializing the database:', err.message));
    }
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Create "packages" table if it does not exist
                yield this.pool.query(`CREATE TABLE IF NOT EXISTS packages (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                version TEXT NOT NULL,
                readme TEXT,
                url TEXT,
                jsprogram TEXT
            )`);
                Logger_1.Logger.logInfo('Packages table created or already exists.');
            }
            catch (err) {
                console.error('Error creating table:', err.message);
            }
        });
    }
    addPackage(packageId, name, version, readme, url, jsprogram) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `INSERT INTO packages (id, name, version, readme, url, jsprogram) VALUES ($1, $2, $3, $4, $5, $6)`;
            try {
                const res = yield this.pool.query(sql, [packageId, name, version, readme, url, jsprogram]);
                console.log(`A new package has been inserted with id: ${packageId}`);
            }
            catch (err) {
                console.error('Error inserting data:', err.message);
            }
        });
    }
    packageExists(packageId) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `SELECT COUNT(*) as count FROM packages WHERE id = $1`; // Use $1 for parameterized queries
            try {
                const res = yield this.pool.query(sql, [packageId]); // Execute the query using pool
                return res.rows[0].count > 0; // Check if count is greater than 0
            }
            catch (err) {
                console.error('Error checking package existence:', err.message);
                throw err; // Rethrow the error for further handling if needed
            }
        });
    }
    deleteAllPackages() {
        return __awaiter(this, void 0, void 0, function* () {
            // Delete all entries from the "packages" table
            const sql = `DELETE FROM packages`;
            try {
                const res = yield this.pool.query(sql);
                console.log(`Deleted ${res.rowCount} entries from the packages table.`);
            }
            catch (err) {
                console.error('Error deleting entries:', err.message);
                throw err;
            }
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.pool.end();
                console.log('Closed the database connection.');
            }
            catch (err) {
                console.error('Error closing the database connection:', err.message);
            }
        });
    }
    /**
     *
     * @param packageID
     * @returns {Promise<{PackageDetails} | null>}: return null if package details if empty
     *                                              current implementation requires user to check whether or not the fields are empty.
     */
    getDetails(packageID) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `SELECT (name, version, readme, url, jsprogram) FROM packages WHERE id = $1`;
            try {
                const res = yield this.pool.query(sql, [packageID]);
                //consider implementing a check to see which fields are left blank and whether or not to return null;
                return res.rows.length ? res.rows[0] : null;
            }
            catch (err) {
                console.error('Error fetching details associated with your package ID', err.message);
                throw err;
            }
        });
    }
}
exports.Database = Database;
