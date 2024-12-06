import { Request, Response } from 'express';
import { PackageService } from '../services/package/PackageService';
import { Package } from '../models/package/Package';
import { PackageQuery } from '../models/package/PackageQuery';
import { PackageRegex } from '../models/package/PackageRegex';
import { PackageID } from '../models/package/PackageID';
import { PackageName } from '../models/package/PackageName';
import { PackageMetadata } from '../models/package/PackageMetadata';
import { Logger } from '../utils/Logger';
import { AuthenticationRequest } from '../models/authentication/AuthenticationRequest';

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
      // Log POST /packages request
      Logger.logInfo(`**************************************
                  POST /packages`);
      Logger.logDebug(`Request Body: ${JSON.stringify(req.body)}`);
      Logger.logDebug (`Request Params: ${JSON.stringify(req.params)}`);
      Logger.logDebug(`Request Query: ${JSON.stringify(req.query)}`);
      Logger.logInfo(`**************************************`);

      const msg_invalid = "There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid."
      try {
          // Package Query Validation
          if (!PackageQuery.isValidQuery(req)) {
              Logger.logInfo(msg_invalid);
              res.status(400).json({description: msg_invalid});
              return;
          }

          let authorization_token = new AuthenticationRequest(req);

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
    */
    static async getPackagesByRegex(req: Request, res: Response) {
      // Log request
      Logger.logInfo(`**************************************
                  POST /package/byRegEx`);
      Logger.logDebug(`Request Body: ${JSON.stringify(req.body)}`);
      Logger.logDebug (`Request Params: ${JSON.stringify(req.params)}`);
      Logger.logDebug(`Request Query: ${JSON.stringify(req.query)}`);
      Logger.logInfo(`**************************************`);

      const msg_invalid = "There is missing field(s) in the PackageRegEx or it is formed improperly, or is invalid";
      if (!PackageRegex.isValidRegexRequest(req)) {
        Logger.logInfo(msg_invalid);
        res.status(400).json({description: msg_invalid});
        return;
      }

      try {

        let authorization_token = new AuthenticationRequest(req); //will throw a shit ton of exceptions
        
        // await authorization_token.incrementCalls(); //are we handling the case even if the api doesn't have a successful response status 

        // Call PackageService to handle business logic
        const regex = req.body.RegEx;
        Logger.logInfo('Matching Regex: '+ regex);
        const packages: PackageMetadata[] = await PackageQueryController.packageService.getPackagesByRegex(regex);
        const jsonResponse = packages.map(pkg => pkg.getJson());
        res.status(200).json(jsonResponse);
      } catch (error) {
          if (error instanceof Error && error.message.includes('400')) {
            res.status(400).json({description: msg_invalid});
            return;
          } else {
            res.status(500).send({message: "Internal Server Error"});
          }
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
      // Log request
      Logger.logInfo(`**************************************
                  GET /package/:id`);
      Logger.logDebug(`Request Body: ${JSON.stringify(req.body)}`);
      Logger.logDebug (`Request Params: ${JSON.stringify(req.params)}`);
      Logger.logDebug(`Request Query: ${JSON.stringify(req.query)}`);
      Logger.logInfo(`**************************************`);
      
      const msg_invalid = "There is missing field(s) in the PackageID or it is formed improperly, or is invalid.";
      try{
        let authorization_token = new AuthenticationRequest(req); //will throw a shit ton of exceptions
        
        // await authorization_token.incrementCalls(); //are we handling the case even if the api doesn't have a successful response status 

        if (!PackageID.isValidGetByIdRequest(req)) {
          Logger.logInfo(msg_invalid);
          res.status(400).json({description: msg_invalid});
          return;
        }
        let pckg : Package = await PackageQueryController.packageService.getPackageById(req.params.id); 

        res.status(200).json(pckg.getJson());
      }catch(error){
        if(error instanceof Error && error.message.includes('404')){
          res.status(404).send({description: 'Package does not exist'});
        } else {
          console.error('Error fetching patches: ', error);
          res.status(500).send({message: "Internal Server Error"});
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
      // Log request
      Logger.logInfo(`**************************************
                  GET /package/:id/rate`);
      Logger.logDebug(`Request Body: ${JSON.stringify(req.body)}`);
      Logger.logDebug (`Request Params: ${JSON.stringify(req.params)}`);
      Logger.logDebug(`Request Query: ${JSON.stringify(req.query)}`);
      Logger.logInfo(`**************************************`);

      const msg_invalid = "There is missing field(s) in the PackageID";
      try {

        let authorization_token = new AuthenticationRequest(req); //will throw a shit ton of exceptions
        
        // await authorization_token.incrementCalls(); //are we handling the case even if the api doesn't have a successful response status 

        if(!authorization_token.isAdmin){
            throw new Error("403: User is not an admin, therefore cannot register users");
        }

        
        if (!PackageID.isValidGetByIdRequest(req)) {
          Logger.logInfo(msg_invalid);
          res.status(400).json({description: msg_invalid});
          return;
        }

        // Get the package id from the request
        const packageId = req.params.id;
        const rating = await PackageQueryController.packageService.getRating(packageId);
        res.status(200).json(rating.getJson());
      }
      catch (error) {
        console.error('Error calculating scores: ', error);
        res.status(500).send({message: "Internal Server Error"});
      };
    }

    /* getCost: Gets cost of a package
     * @param req: Request object
     * @param res: Response object
     * 
     * Method: GET
     * Route: /package/{id}/cost
     * 
     * Description: User gives id of package in params.
     * Sets response to Cost if all metrics were computed successfully
     * Sets status to 200 (all metrics success), 400 (invalid req), 404 (package DNE), 500 (package cost system broke)
     */
    static async getCost(req: Request, res: Response) {
      try { 
        let authorization_token = new AuthenticationRequest(req); //will throw a shit ton of exceptions
        
        // await authorization_token.incrementCalls(); //are we handling the case even if the api doesn't have a successful response status 

        const msg_invalid = "There is missing field(s) in the PackageID";
        if(req.query.dependency !== 'true' && req.query.dependency !== 'false'){
          Logger.logInfo(msg_invalid);
          res.status(400).json({description: msg_invalid});
          return;
        }
        if (!PackageID.isValidGetByIdRequest(req)) {
          Logger.logInfo(msg_invalid);
          res.status(400).json({description: msg_invalid});
          return;
        }

        // Get the package key from the id (for S3)
        const packageId = req.params.id;
        const dependency = req.query.dependency === 'true';

        // Get the package id from the request
        const cost = await PackageQueryController.packageService.getCost(packageId, dependency);

        res.status(200).json(cost);
      }
      catch (error) {
        if(error instanceof Error && error.message.includes('404')){
          res.status(404).send({description: 'Package does not exist'});
        }
        else
        {
          res.status(500).send({message: "The package rating system choked on at least one of the metrics."});
        }
      };
    }

    /* getTrack: Return extension track that we are working on
     */
    static async getTracks(req: Request, res: Response) {
      // Log request
      Logger.logInfo(`**************************************
                  GET /tracks`);
      Logger.logDebug(`Request Body: ${JSON.stringify(req.body)}`);
      Logger.logDebug (`Request Params: ${JSON.stringify(req.params)}`);
      Logger.logDebug(`Request Query: ${JSON.stringify(req.query)}`);
      Logger.logInfo(`**************************************`);
      try {

        const plannedTracks = {
          plannedTracks: [
            "Access control track"
          ]
        };

        res.status(200).json(plannedTracks);
      } catch (err) {
        Logger.logError('Error fetching tracks:', err);
        res.status(500).send({description: "The system encountered an error while retrieving the student's track information."});
      }
    }


}