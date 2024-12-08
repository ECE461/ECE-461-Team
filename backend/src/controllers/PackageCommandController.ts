import { Request, Response } from 'express';
import { PackageService } from '../services/package/PackageService';
import { PackageData } from '../models/package/PackageData';
import { Package } from '../models/package/Package';
import { Logger } from '../utils/Logger';
import { PackageID } from '../models/package/PackageID';
import { PackageName } from '../models/package/PackageName';
import { AuthenticationRequest } from '../models/authentication/AuthenticationRequest';

/* PackageCommandController: Handles all API actions that modify state (delete, update), sets "res" status and data
 * Handles Initial Request Validation
 * @method: uploadPackage
 * @method: updatePackage
 * @method: reset
 * @method: deletePackageById
 * @method: deletePackageByName
 * @method: createAccessToken
 */
export class PackageCommandController {
    static readonly INVALID_AUTHENTICATION = "Authentication failed due to invalid or missing AuthenticationToken.";
    static packageService = new PackageService();

    /* uploadPackage: Uploads package from content or ingests package from URL.
     * @param req: Request object
     * @param res: Response object
     * 
     * Method: POST
     * Route: /package
     * 
     * Description: User gives Content (base-64 encoded zipped content) or Package URL, and JSProgram (Extension)
     * If URL, service checks if passes rating then converts to "Content" if passes check
     * Sets response to Package (see models/package/Package.ts)
     * Sets status to 201 (success), 400 (invalid req), 409 (package exists already), or 424 (package not uploaded due to disqualified rating (only for URL uploads))
     * 
     */
    static async uploadPackage(req: Request, res: Response) {
        const endpointName = "POST /package (UPLOAD)";
        // Log request
        PackageCommandController.logRequest(req, endpointName);

        try {
            // await authorization_token.incrementCalls(); //are we handling the case even if the api doesn't have a successful response status
            let authorization_token = new AuthenticationRequest(req); //will throw a shit ton of exceptions
            const user = authorization_token.getUserId();
            authorization_token.updateCalls();

            // Check if request is valid + has all required fields
            if (!PackageData.isValidUploadRequestBody(req.body)) {
                throw new Error("400: Invalid Request: Not correct format");
            }

            // Get source from URL or Content
            const source = req.body.URL ? req.body.URL : req.body.Content;
        
            Logger.logInfo("Parsing request data")
            const jsProgram : string = req.body.JSProgram ? req.body.JSProgram : "";

            // Debloat and Name only set if source is Content???
            const debloat: boolean = req.body.debloat ? req.body.debloat : false;
            const name: string = req.body.Name ? req.body.Name : "";
            const version: string = req.body.Version ? req.body.Version : "";

            Logger.logInfo("Creating Package Data Object")
            const packageData = await PackageData.create(source, jsProgram);

            Logger.logInfo("Uploading Package: To S3 and RDS")
            const pack : Package = await PackageCommandController.packageService.uploadPackage(packageData, debloat, name, version, user);
            PackageCommandController.sendResponse(res, 201, pack.getJson(), endpointName);
        } catch (error) {
            if ((error instanceof Error) && (error.message.includes('424'))) {
                const response = {description: "Package is not uploaded due to the disqualified rating."};
                PackageCommandController.sendResponse(res, 424, response, endpointName, error);
            } else if ((error instanceof Error) && error.message.includes('400')) {
                const msg_invalid = "There is missing field(s) in the PackageData or it is formed improperly (e.g. Content and URL ar both set)";
                PackageCommandController.sendResponse(res, 400, {description: msg_invalid}, endpointName, error);
            } else if ((error instanceof Error) && error.message.includes('409')){
                const response = {description: "Package already exists"};
                PackageCommandController.sendResponse(res, 409, response, endpointName, error);
            } else if ((error instanceof Error) && error.message.includes('403')){
                const response = {description: PackageCommandController.INVALID_AUTHENTICATION};
                PackageCommandController.sendResponse(res, 403, response, endpointName, error);
            } else {
                const response = {description: "Internal Server Error"};
                PackageCommandController.sendResponse(res, 500, response, endpointName, error);
            }
        }
    }

    /* updatePackage: Updates package with new package content
     * @param req: Request object
     * @param res: Response object
     * 
     * Method: POST
     * Route: /package/{id}
     * 
     * Description: User gives id of package in params + Package information (see models/package/Package.ts) in req body
     * Updates database/storage with new package information
     * Sets response status to 200 (success), 400 (invalid request), 404 (package does not exist), 409 (package already exists)
     */
    static async updatePackage(req: Request, res: Response) {    
        const endpointName = "POST /package/:id (UPDATE)";
        // Log request
        PackageCommandController.logRequest(req, endpointName);

        // Parse information:
        try {
            let authorization_token = new AuthenticationRequest(req); //will throw a shit ton of exceptions
            const user = authorization_token.getUserId();

            // Check if ID in param exists first:
            const id = req.params.id;
            if (!(await this.packageService.checkPackageIDExists(id))) {
                throw new Error("404: Package does not exist");
            }

            if (!PackageData.isValidUpdateRequestBody(req.body) || !PackageID.isValidGetByIdRequest(req)) {
                throw new Error("400: Invalid Request: Not correct format");
            }

            // Check if package ID in metadata matches ID in request params
            if (req.body.metadata.ID !== req.params.id) {
                throw new Error(`400: Package ID does not match ID in request body: ${req.body.metadata.ID} vs ${req.params.id}`);
            }

            // Check if package name in metadata matches name in request body
            if (req.body.metadata.Name !== req.body.data.Name) {
                throw new Error(`400: Package name does not match name in request body: ${req.body.metadata.Name} vs ${req.body.data.Name}`);
            }

            // Check if both versions are the same
            if (req.body.metadata.Version !== req.body.data.Version) {
                throw new Error(`400: Package version does not match version in request body: ${req.body.metadata.Version} vs ${req.body.data.Version}`);
            }

            // Check if old package id exists:
            const oldID = req.body.metadata.ID;
            if (!(await PackageCommandController.packageService.checkPackageIDExists(oldID))) {
                throw new Error("404: Package does not exist");
            }

            const source = req.body.data.URL ? req.body.data.URL : req.body.data.Content;
            const jsProgram : string = req.body.data.JSProgram ? req.body.data.JSProgram : "";
            const debloat: boolean = req.body.data.debloat ? req.body.data.debloat : false;
            const name: string = req.body.data.Name ? req.body.data.Name : "";
            const version: string = req.body.metadata.Version;
    

            // Create Package Data Object
            Logger.logInfo("Creating Package Data Object")
            const packageData = await PackageData.create(source, jsProgram);

            // Update Package
            Logger.logInfo(`Updating Package: Name: ${name}, Version: ${req.body.metadata.Version}`)
            await PackageCommandController.packageService.updatePackage(packageData, debloat, name, version, oldID, user);
            PackageCommandController.sendResponse(res, 200, {description: "Version is updated."}, endpointName);

        } catch (error) {
            if ((error instanceof Error) && error.message.includes('404')) {
                const response = {description: "Package does not exist."};
                PackageCommandController.sendResponse(res, 404, response, endpointName, error);
            } else if ((error instanceof Error) && error.message.includes('400')) {
                const response = "There is missing field(s) in the PackageID or it is formed improperly, or is invalid."; 
                PackageCommandController.sendResponse(res, 400, {description: response}, endpointName, error);
            } else if ((error instanceof Error) && error.message.includes('409')){
                const response = {description: "Package already exists."};
                PackageCommandController.sendResponse(res, 409, response, endpointName, error);
            } else if ((error instanceof Error) && error.message.includes('403')){
                const response = {description: PackageCommandController.INVALID_AUTHENTICATION};
                PackageCommandController.sendResponse(res, 403, response, endpointName, error);
            } else {
                const response = {description: "Internal Server Error"};
                PackageCommandController.sendResponse(res, 500, response, endpointName, error);
            }
        }
        
        
    }

    /* reset: Resets all storage information
     * @param req: Request object
     * @param res: Response object
     * 
     * Method: DELETE
     * Route: /reset
     * 
     * Description: Resets registry
     * Sets response to 200 (success), 400 (invalid req), 401 (no permission to reset)
     */
    static async reset(req: Request, res: Response) {
        const endpointName = "DELETE /reset (RESET)";
        // Log request
        PackageCommandController.logRequest(req, endpointName);

        try {
            let authorization_token = new AuthenticationRequest(req); //will throw a shit ton of exceptions
            await authorization_token.updateCalls();

            if(!authorization_token.isAdmin){
                throw new Error("403: User is not an admin, therefore cannot register users");
            }
            

            await PackageCommandController.packageService.reset();
            PackageCommandController.sendResponse(res, 200, {description: "Registry is reset."}, endpointName);
        } catch (error) {
            if ((error instanceof Error) && error.message.includes('403')){
                const response = {description: PackageCommandController.INVALID_AUTHENTICATION};
                PackageCommandController.sendResponse(res, 403, response, endpointName, error);
            } else if ((error instanceof Error) && error.message.includes('400')) {
                const response = "There is missing field(s) in the PackageID or it is formed improperly, or is invalid."; 
                PackageCommandController.sendResponse(res, 400, {description: response}, endpointName, error);
            } else {
                const response = {description: "Internal Server Error"};
                PackageCommandController.sendResponse(res, 500, response, endpointName, error);
            }
        }
    }

    /* deletePackageById: Deletes a specific package+version
     * @param req: Request object
     * @param res: Response object
     * 
     * Method: DELETE
     * Route: /package/{id}
     * 
     * Description: Given package id, deletes single package+version
     * Sets response to 200 (success), 400 (invalid req), 404 (package DNE)
     */
    static async deletePackageById(req: Request, res: Response) { // NON-BASELINE
        const endpointName = "DELETE /package/:id (DELETE BY ID)";
        // Log request
        PackageCommandController.logRequest(req, endpointName);


        try{
            if (!PackageID.isValidGetByIdRequest(req)) {
                throw new Error("400: Invalid Request: Not correct format");
            }

            let authorization_token = new AuthenticationRequest(req);
            await authorization_token.updateCalls();
            
            await PackageCommandController.packageService.deletePackageById(req.params.id); 
            
            Logger.logInfo(`Successfully deleted package via ID: ${req.params.id}`);
            PackageCommandController.sendResponse(res, 200, {description: "Successfully deleted package via ID."}, endpointName);
        } catch(error){
            if(error instanceof Error && error.message.includes('404')){
                const response = {description: "Package does not exist."};
                PackageCommandController.sendResponse(res, 404, response, endpointName, error);
            } else if ((error instanceof Error) && error.message.includes('403')){
                const response = {description: PackageCommandController.INVALID_AUTHENTICATION};
                PackageCommandController.sendResponse(res, 403, response, endpointName, error);
            } else if ((error instanceof Error) && error.message.includes('400')) {
                const msg_invalid = "There is missing field(s) in the PackageID or it is formed improperly, or is invalid.";
                PackageCommandController.sendResponse(res, 400, {description: msg_invalid}, endpointName);
            } else {
                const response = {description: "Internal Server Error"};
                PackageCommandController.sendResponse(res, 500, response, endpointName, error);
            }
        }
    }

    /* deletePackageByName: Deletes a package by name (all versions)
     * @param req: Request object
     * @param res: Response object
     * 
     * Method: DELETE
     * Route: /package/byName/{name}
     * 
     * Description: Given package name, deletes all package versions
     * Sets response to 200 (success), 400 (invalid req), 404 (package DNE)
     */
    static async deletePackageByName(req: Request, res: Response) {
        const endpointName = "DELETE /package/byName/:name (DELETE ALL VERSIONS)";
        // Log request
        PackageCommandController.logRequest(req, endpointName);
        
        try{
            const msg_invalid = "There is missing field(s) in the PackageName or it is formed improperly, or is invalid."
            if (!PackageName.isValidGetByNameRequest(req)) {
                throw new Error("400: Invalid Request: Not correct format");
            }

            let authorization_token = new AuthenticationRequest(req);
            await authorization_token.updateCalls();
            
            await PackageCommandController.packageService.deletePackageByName(req.params.name);

            PackageCommandController.sendResponse(res, 200, {description: "Successfully deleted package via name."}, endpointName);

        }catch(error){
            if(error instanceof Error && error.message.includes('404')) {
                const response = {description: "Package does not exist."};
                PackageCommandController.sendResponse(res, 404, response, endpointName, error);
            } else if ((error instanceof Error) && error.message.includes('403')){
                const response = {description: PackageCommandController.INVALID_AUTHENTICATION};
                PackageCommandController.sendResponse(res, 403, response, endpointName, error);
            } else if ((error instanceof Error) && error.message.includes('400')) {
                const msg_invalid = "There is missing field(s) in the PackageName or it is formed improperly, or is invalid.";
                PackageCommandController.sendResponse(res, 400, {description: msg_invalid}, endpointName, error);
            } else {
                const response = {description: "Internal Server Error"};
                PackageCommandController.sendResponse(res, 500, response, endpointName, error);
            }
        }
    }

    /* createAccessToken
     * @param req: Request object
     * @param res: Response object
     * 
     * Method: PUT
     * Route: /authenticate
     * 
     * Description: Given Authentication request with name, isAdmin, + password
     * Authenticate user and set response to an AuthenticationToken
     * Set status to 200 (success), 400 (invalid req), 401 (user/password invalid), 501 (system does not support authentication)
     */
    static async createAccessToken(req: Request, res: Response) { // Non-baseline --> add to user/authenticate endpoint or not
        await PackageCommandController.packageService.addDefaultUser(); 
        await PackageCommandController.packageService.dummyToken(); 

        const endpointName = "PUT /authenticate (LOGIN)";
        // Log request
        PackageCommandController.logRequest(req, endpointName);

        try {
            if (!AuthenticationRequest.isValidRequest(req)) {
                throw new Error("400: Invalid Request: Not correct format");
            }
            
            let token: string = await PackageCommandController.packageService.createAccessToken(req.body.User.name, req.body.Secret.password, req.body.User.isAdmin);

            Logger.logInfo(`${endpointName}: Successfully created token for user: ${req.body.User.name}: ${token}`);
            res.status(200).send(token);

        } catch(err: any) {

            if (err instanceof Error && err.message.includes('401')) {
                const response = {description: 'The user or password is invalid.'};
                PackageCommandController.sendResponse(res, 401, response, endpointName, err);
            } else if ((err instanceof Error) && err.message.includes('403')){
                const response = {description: PackageCommandController.INVALID_AUTHENTICATION};
                PackageCommandController.sendResponse(res, 403, response, endpointName, err);
            } else if ((err instanceof Error) && err.message.includes('400')){
                const msg_invalid = "There is missing field(s) in the AuthenticationRequest or it is formed improperly.";
                PackageCommandController.sendResponse(res, 400, {description: msg_invalid}, endpointName, err);
            } else {
                const response = {description: "Internal Server Error"};
                PackageCommandController.sendResponse(res, 500, response, endpointName, err);
            }
        }
    }


    /* deletePackageByName: Deletes a package by name (all versions)
     * @param req: Request object
     * @param res: Response object
     * 
     * Method: POST
     * Route: /register
     * 
     * Description: allows admins to register 
     */
    static async registerUser(req: Request, res: Response){
        const endpointName = "POST /register (REGISTER USER)";
        // Log request
        PackageCommandController.logRequest(req, endpointName);
        
        try{

            if (!AuthenticationRequest.isValidRequest(req)) {
                throw new Error("400: Invalid Request: Not correct format");
            }

            let authorization_token = new AuthenticationRequest(req); //will throw a shit ton of exceptions
            await authorization_token.updateCalls(); //are we handling the case even if the api doesn't have a successful response status 
            
    
            if(!authorization_token.isAdmin){
                throw new Error("403: User is not an admin, therefore cannot register users");
            }

            await PackageCommandController.packageService.registerUser(req.body.User.name, req.body.User.isAdmin, req.body.Secret.password)
            PackageCommandController.sendResponse(res, 200, { description: 'User successfully registered' }, endpointName);

        } catch (err: any){
            if (err instanceof Error && err.message.includes('409')) {
                const response = {description: 'User has already been registered'};
                PackageCommandController.sendResponse(res, 409, response, endpointName, err);
            }
            else if (err instanceof Error && err.message.includes('500')){
                const response = {description: 'Error registering user.'};
                PackageCommandController.sendResponse(res, 500, response, endpointName, err);
            } else if (err instanceof Error && err.message.includes('400')) {
                const msg_invalid = "There is missing field(s) in the AuthenticationRequest or it is formed improperly.";
                PackageCommandController.sendResponse(res, 400, {description: msg_invalid}, endpointName);
            } else if (err instanceof Error && err.message.includes('403')){
                const response = {description: PackageCommandController.INVALID_AUTHENTICATION};
                PackageCommandController.sendResponse(res, 403, response, endpointName, err);
            } else {
                const response = {description: "Internal Server Error"};
                PackageCommandController.sendResponse(res, 500, response, endpointName, err);
            }
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
            res.status(status).json(response);
            if (error) {
                Logger.logError(`${endpoint} ${status}:` ,error);
            }
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