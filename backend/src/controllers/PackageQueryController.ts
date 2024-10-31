import { Request, Response } from 'express';
import { PackageService } from '../services/package/PackageService';
import { Package } from '../models/package/Package';
import { PackageQuery } from '../models/package/PackageQuery';
import { PackageRegex } from '../models/package/PackageRegex';
import { PackageID } from '../models/package/PackageID';
import { PackageName } from '../models/package/PackageName';
import { PackageMetadata } from '../models/package/PackageMetadata';
import { Logger } from '../utils/Logger';

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
          // Package Query Validation
          if (!PackageQuery.isValidQuery(req)) {
              res.status(400).json(PackageQueryController.MSG_INVALID);
              return;
          }

          // Call PackageService to handle business logic
          const offset = req.query.offset ? Number(req.query.offset) : 0;
          const packages = await PackageQueryController.packageService.getPackagesByQuery(req.body, offset);
          res.setHeader('offset', (offset + packages.length).toString());
          res.status(200).json(packages);
      } catch (error) {
          Logger.logError('Error fetching patches: ', error);
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
      if (!PackageRegex.isValidRegexRequest(req)) {
        res.status(400).json(PackageQueryController.MSG_INVALID);
        return;
      }
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
      try{
        if (!PackageID.isValidGetByIdRequest(req)) {
          res.status(400).json(PackageQueryController.MSG_INVALID);
          return;
        }
        let pckg : Package = await PackageQueryController.packageService.getPackageById(req.params.id); 

        res.status(200).json(pckg.getJson());
      }catch(error){
        if(error instanceof Error && error.message.includes('404')){
          res.status(500).send({description: 'Package does not exist'});
        }
      }

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
      if (!PackageID.isValidGetByIdRequest(req)) {
        res.status(400).json(PackageQueryController.MSG_INVALID);
        return;
      }
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
      if (!PackageName.isValidGetByNameRequest(req)) {
        res.status(400).json(PackageQueryController.MSG_INVALID);
        return;
      }
    }
}