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
    static readonly INVALID_AUTHENTICATION = "Authentication failed due to invalid or missing AuthenticationToken.";
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
      const endpointName = 'POST /packages (QUERY)';
      // Log POST /packages request
      PackageQueryController.logRequest(req, endpointName);

      
      try {
          // Package Query Validation
          if (!PackageQuery.isValidQuery(req)) {
              throw new Error('400: Invalid PackageQuery');
          }

          let authorization_token = new AuthenticationRequest(req);

          // Call PackageService to handle business logic
          const offset = req.query.offset ? Number(req.query.offset) : 0;
          const packages = await PackageQueryController.packageService.getPackagesByQuery(req.body, offset);

          Logger.logInfo(`Offset set to: ${offset}`);
          res.setHeader('offset', (offset + packages.length).toString());

          PackageQueryController.sendResponse(res, 200, packages, endpointName);
      } catch (error) {
          if (error instanceof Error && error.message.includes('400')) {
            const msg_invalid = "There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.";
            PackageQueryController.sendResponse(res, 400, {description: msg_invalid}, endpointName, error);
          } else if ((error instanceof Error) && error.message.includes('403')){
            const response = {description: PackageQueryController.INVALID_AUTHENTICATION};
            PackageQueryController.sendResponse(res, 403, response, endpointName, error);
          } else {
            const response = {description: "Internal Server Error"};
            PackageQueryController.sendResponse(res, 500, response, endpointName, error);
          }
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
      const endpointName = 'POST /package/byRegEx (REGEX)';
      // Log request
      PackageQueryController.logRequest(req, endpointName);

      if (!PackageRegex.isValidRegexRequest(req)) {
        throw new Error('400: Invalid PackageRegex');
      }

      try {

        let authorization_token = new AuthenticationRequest(req); //will throw a shit ton of exceptions
        
        // await authorization_token.incrementCalls(); //are we handling the case even if the api doesn't have a successful response status 

        // Call PackageService to handle business logic
        const regex = req.body.RegEx;
        Logger.logInfo('Matching Regex: '+ regex);
        const packages: PackageMetadata[] = await PackageQueryController.packageService.getPackagesByRegex(regex);
        const jsonResponse = packages.map(pkg => pkg.getJson());
        // If length == 0, throw 404 error:
        if (packages.length === 0) {
          throw new Error("404: No matching packages");
        }

        PackageQueryController.sendResponse(res, 200, jsonResponse, endpointName);
      } catch (error) {
          if (error instanceof Error && error.message.includes('400')) {
            const msg_invalid = "There is missing field(s) in the PackageRegEx or it is formed improperly, or is invalid";
            PackageQueryController.sendResponse(res, 400, {description: msg_invalid}, endpointName, error);
          } else if ((error instanceof Error) && error.message.includes('403')){
            const response = {description: PackageQueryController.INVALID_AUTHENTICATION};
            PackageQueryController.sendResponse(res, 403, response, endpointName, error);
          } else if ((error instanceof Error) && error.message.includes('404')) {
            const response = {description: 'No packages found matching the regex'};
            PackageQueryController.sendResponse(res, 404, response, endpointName, error);
          } else {
            const response = {description: "Internal Server Error"};
            PackageQueryController.sendResponse(res, 500, response, endpointName, error);
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
      const endpointName = 'GET /package/:id (DOWNLOAD)';
      // Log request
      PackageQueryController.logRequest(req, endpointName);
      
      
      try{
        let authorization_token = new AuthenticationRequest(req); //will throw a shit ton of exceptions
        
        // await authorization_token.incrementCalls(); //are we handling the case even if the api doesn't have a successful response status 

        if (!PackageID.isValidGetByIdRequest(req)) {
          throw new Error("400: Invalid format")
        }
        let pckg : Package = await PackageQueryController.packageService.getPackageById(req.params.id); 

        PackageQueryController.sendResponse(res, 200, pckg.getJson(), endpointName);
      }catch(error){
        if(error instanceof Error && error.message.includes('404')){
          const response = {description: 'Package does not exist'};
          PackageQueryController.sendResponse(res, 404, response, endpointName, error);
          
        } else if (error instanceof Error && error.message.includes('400')) {
          const msg_invalid = "There is missing field(s) in the PackageID or it is formed improperly, or is invalid.";
          PackageQueryController.sendResponse(res, 400, {description: msg_invalid}, endpointName, error);
        } else if ((error instanceof Error) && error.message.includes('403')){
          const response = {description: PackageQueryController.INVALID_AUTHENTICATION};
          PackageQueryController.sendResponse(res, 403, response, endpointName, error);
        } else {
          const response = {description: "Internal Server Error"};
          PackageQueryController.sendResponse(res, 500, response, endpointName, error);
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
      const endpointName = 'GET /package/:id/rate (RATING)';
      // Log request
      PackageQueryController.logRequest(req, endpointName);

      
      try {

        let authorization_token = new AuthenticationRequest(req); //will throw a shit ton of exceptions
        
        // await authorization_token.incrementCalls(); //are we handling the case even if the api doesn't have a successful response status 

        if(!authorization_token.isAdmin){
            throw new Error("403: User is not an admin, therefore cannot register users");
        }

        
        if (!PackageID.isValidGetByIdRequest(req)) {
          throw new Error("400: Invalid Query Request");
        }

        // Get the package id from the request
        const packageId = req.params.id;
        const rating = await PackageQueryController.packageService.getRating(packageId);
        PackageQueryController.sendResponse(res, 200, rating.getJson(), endpointName);
      }
      catch (error) {
        if (error instanceof Error && error.message.includes('400')) {
          const msg_invalid = "There is missing field(s) in the PackageID";
          PackageQueryController.sendResponse(res, 400, {description: msg_invalid}, endpointName, error);
        } else if ((error instanceof Error) && error.message.includes('403')){
          const response = {description: PackageQueryController.INVALID_AUTHENTICATION};
          PackageQueryController.sendResponse(res, 403, response, endpointName, error);
        } else {
          const response = {description: "The package rating system choked on at least one of the metrics."};
          PackageQueryController.sendResponse(res, 500, response, endpointName, error);
        }
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
      const endpointName = 'GET /package/:id/cost (COST)';
      // Log request
      PackageQueryController.logRequest(req, endpointName);

      try { 
        let authorization_token = new AuthenticationRequest(req); //will throw a shit ton of exceptions
        
        // await authorization_token.incrementCalls(); //are we handling the case even if the api doesn't have a successful response status 

        if(req.query.dependency !== 'true' && req.query.dependency !== 'false'){
          throw new Error("400: Invalid format ");
        }
        if (!PackageID.isValidGetByIdRequest(req)) {
          throw new Error("400: Invalid format");
        }

        // Get the package key from the id (for S3)
        const packageId = req.params.id;
        const dependency = req.query.dependency === 'true';

        // Get the package id from the request
        const cost = await PackageQueryController.packageService.getCost(packageId, dependency);
        PackageQueryController.sendResponse(res, 200, cost, endpointName);
      }
      catch (error) {
        if(error instanceof Error && error.message.includes('404')){
          const response = {description: 'Package does not exist'};
          PackageQueryController.sendResponse(res, 404, response, endpointName, error);
        } else if (error instanceof Error && error.message.includes('400')) {
          const msg_invalid = "There is missing field(s) in the PackageID";
          PackageQueryController.sendResponse(res, 400, {description: msg_invalid}, endpointName, error);
        } else if ((error instanceof Error) && error.message.includes('403')){
          const response = {description: PackageQueryController.INVALID_AUTHENTICATION};
          PackageQueryController.sendResponse(res, 403, response, endpointName, error);
        } else {
          const response = {description: "The package rating system choked on at least one of the metrics."};
          PackageQueryController.sendResponse(res, 500, response, endpointName, error);
        }
      };
    }

    /* getTrack: Return extension track that we are working on
     */
    static async getTracks(req: Request, res: Response) {
      const endpointName = 'GET /tracks';
      // Log request
      PackageQueryController.logRequest(req, endpointName);

      try {

        const plannedTracks = {
          plannedTracks: [
            "Access control track"
          ]
        };

        PackageQueryController.sendResponse(res, 200, plannedTracks, endpointName);
      } catch (err) {
        const response = {description: "The system encountered an error while retrieving the student's track information."};
        PackageQueryController.sendResponse(res, 500, response, endpointName, err);
      }
    }

    /* 
     * @method: sendResponse: Helper function- Sends response to client, logs response
     * @param res: Response object
     * @param status: Status code
     * @param response: Response data in JSON format
     * @param endpoint: Endpoint name
     * @param error: Error object (if exists)
     */
    static async sendResponse(res: Response, status: number, response: any, endpoint: string, error?: any) {
      Logger.logInfo("*********************RESPONSE***********************");
      Logger.logInfo(`Sending respoinse for ${endpoint}`);
      Logger.logInfo(`Status: ${status}`);
      Logger.logDebug(`Response: ${JSON.stringify(response)}`);
      Logger.logInfo("********************************************");
      if (error) {
        Logger.logError(`${endpoint} ${status}:` ,error);
      }
      res.status(status).json(response);
    }

    /* @method logRequest: Logs request information
      * @param req: Request object
      * @param endpoint: Endpoint name
      */
    static async logRequest(req: Request, endpoint: string) {
        Logger.logInfo(`*******************REQUEST*******************`);
        Logger.logInfo(`            ${endpoint}`);
        Logger.logDebug(`Request headers: ${JSON.stringify(req.headers)}`);
        Logger.logDebug(`Request Body: ${JSON.stringify(req.body)}`);
        Logger.logDebug (`Request Params: ${JSON.stringify(req.params)}`);
        Logger.logDebug(`Request query: ${JSON.stringify(req.query)}`);
        Logger.logInfo(`**************************************`);
    }
}