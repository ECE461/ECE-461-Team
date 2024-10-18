import { Request, Response } from 'express';
import { PackageService } from '../services/package/PackageService';
import { Package } from '../models/package/Package';
import { PackageQuery } from '../models/package/PackageQuery';

/* PackageQueryController: Handles all API calls for read-only actions, sets "res" status and data
 * Handles Initial Request Validation
 * @method: getPackagesByQuery
 * @method: getPackagesByRegex
 * @method: getPackageById
 * @method: getRating
 * @method: getPackageHistoryByName
 */
export class PackageQueryController {

    static packageService = new PackageService();
    static readonly MSG_INVALID = {message: "There is missing field(s) in the PackageQuery/AuthenticationToken or it is formed improperly, or the AuthenticationToken is invalid."};

    /* getPackagesByQuery: Gets any packages fitting query (see models/package/PackageQuery.ts)
    *  @param req: Request object
    *  @param res: Response object
    * 
    *  Method: POST
    *  Route: /packages
    *  
    *  Description: User gives array of package queries (request body) + offset (optional - assume 0).
    *  Sets "res" to array of package metadata + next offset user should use for pagination (in header)
    *  Also sets status code to 200 (success), 400 (invalid request), or 413 (too many packages returned - if no pagination?) 
    */
    static async getPackagesByQuery(req: Request, res: Response) : Promise<void> {
        try {
            // Offset Validation
            const offset = req.query.offset ? Number(req.query.offset) : 0;
            if (isNaN(offset) || offset < 0 || !Number.isInteger(offset)) {
              res.status(400).json(PackageQueryController.MSG_INVALID);
              return;
            }

            // Package Query Validation
            if (!PackageQuery.isValidQuery(req.body)) {
                res.status(400).json(PackageQueryController.MSG_INVALID);
                return;
            }

            // Call PackageService to handle business logic
            const packages = await PackageQueryController.packageService.getPackagesByQuery(req.body, offset);

            res.setHeader('offset', (offset + packages.length).toString());
            res.status(200).json(packages);
        } catch (error) {
            console.error('Error fetching patches: ', error);
            res.status(500).send({message: "Internal Server Error"});
        }
    }

    /* getPackagesByRegex: Gets any packages where READMEs or package name fit regex.
    *  @param req: Request object
    *  @param res: Response object
    * 
    *  Method: POST
    *  Route: /package/byRegEx
    * 
    *  Description: Given Regex, returns PackageMetadata
    *  of all packages that have READMEs or package names that match the regex. 
    *  Sets "res" to array of package metadata.
    *  Sets status code to 200 (success), 400 (invalid request), or 404 (no packages found matching regex)
    * 
    *  TODO: (1) check no need for pagination, (2) Check if need to return ID also (see yaml file)
    */
    static async getPackagesByRegex(req: Request, res: Response) {

        // res.status(400).json(PackageQueryController.MSG_INVALID);

        const fakeRes = [
            {
                "Version: ": "1.2.3",
                "Name: ": "React",
                "ID: ": "React1.2.3"
            },
            {
                "Version: ": "1.2.4",
                "Name: ": "React",
                "ID: ": "React1.2.4"
            }
        ]
        res.status(200).json(fakeRes); // Success
    }
    
    /* getPackageById: Gets single package by ID (download package).
     * @param req: Request object
     * @param res: Response object
     * 
     * Method: GET
     * Route: /package/:id
     * 
     * Description: Given package ID, sets response as package information (see models/package/Package.ts)
     * includes metadata + data (Content + JSProgram)
     * Sets status to 200 (success), 400 (invalid request), or 404 (package does not exist)
     */
    static async getPackageById(req: Request, res: Response) {
        // res.status(400).json(PackageQueryController.MSG_INVALID);
        const fakeRes = {
            metadata: {
                Name: "React",
                Version: "1.2.3",
                ID: "React1.2.3"
            },
            data: {
                Content: "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"
            }
        }

        res.status(200).json(fakeRes);
    }
    
    /* getRating: Gets rating of a package
     * @param req: Request object
     * @param res: Response object
     * 
     * Method: GET
     * Route: /package/{id}/rate
     * 
     * Description: User gives id of package in params.
     * Sets response to Rating if all metrics were computed successfully
     * Sets status to 200 (all metrics success), 400 (invalid req), 404 (package DNE), 500 (package rating system broke on at least one metric)
     */
    static async getRating(req: Request, res: Response) {
        const fakeRes = {
            "BusFactor": 0,
            "Correctness": 0,
            "RampUp": 0,
            "ResponsiveMaintainer": 0,
            "LicenseScore": 0,
            "GoodPinningPractice": 0,
            "PullRequest": 0,
            "NetScore": 0
        }
        res.status(200).json(fakeRes);
        // res.status(400).json(PackageQueryController.MSG_INVALID);
    }
    
    /* getPackageHistoryByName: Gets all package history (all versions)
     * @param req: Request object
     * @param res: Response object
     * 
     * Method: GET
     * Route: /package/byName/{name}
     * 
     * Description: Given package name, sets response to array of PackageHistoryEntry (see /models/package/PackageHistoryEntry)
     * Sets response to 200 (success), 400 (invalid req), 404 (package DNE)
     */
    static async getPackageHistoryByName(req: Request, res: Response) { // NON-BASELINE
        const fakeRes = [
            {
              "User": {
                "name": "James Davis",
                "isAdmin": true
              },
              "Date": "2023-03-23T23:11:15Z",
              "PackageMetadata": {
                "Name": "Underscore",
                "Version": "1.0.0",
                "ID": "underscore"
              },
              "Action": "DOWNLOAD"
            },
            {
              "User": {
                "name": "James Davis",
                "isAdmin": true
              },
              "Date": "2023-03-22T23:06:25Z",
              "PackageMetadata": {
                "Name": "Underscore",
                "Version": "1.0.0",
                "ID": "underscore"
              },
              "Action": "UPDATE"
            },
            {
              "User": {
                "name": "James Davis",
                "isAdmin": true
              },
              "Date": "2023-03-21T22:59:40Z",
              "PackageMetadata": {
                "Name": "Underscore",
                "Version": "1.0.0",
                "ID": "underscore"
              },
              "Action": "RATE"
            },
            {
              "User": {
                "name": "James Davis",
                "isAdmin": true
              },
              "Date": "2023-03-20T22:45:31Z",
              "PackageMetadata": {
                "Name": "Underscore",
                "Version": "1.0.0",
                "ID": "underscore"
              },
              "Action": "CREATE"
            }
          ]

        res.status(200).json(fakeRes);
        // res.status(400).json(PackageQueryController.MSG_INVALID);
    }
}