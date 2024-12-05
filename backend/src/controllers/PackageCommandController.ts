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
        // Log request
        Logger.logInfo(`**************************************
                    POST /package`);
        Logger.logDebug(`Request Body: ${JSON.stringify(req.body)}`);
        Logger.logDebug (`Request Params: ${JSON.stringify(req.params)}`);
        Logger.logDebug(`Request Query: ${JSON.stringify(req.query)}`);
        Logger.logInfo(`**************************************`);

        const msg_invalid = "There is missing field(s) in the PackageData or it is formed improperly (e.g. Content and URL ar both set)";
        // Check if request is valid + has all required fields
        if (!PackageData.isValidUploadRequestBody(req.body)) {
            Logger.logInfo(msg_invalid);
            res.status(400).json({description: msg_invalid});
            return;
        }

        // Get source from URL or Content
        const source = req.body.URL ? req.body.URL : req.body.Content;
        
        try {
            Logger.logInfo("Parsing request data")
            const jsProgram : string = req.body.JSProgram ? req.body.JSProgram : "";

            // Debloat and Name only set if source is Content???
            const debloat: boolean = req.body.debloat ? req.body.debloat : false;
            const name: string = req.body.Name ? req.body.Name : "";

            Logger.logInfo("Creating Package Data Object")
            const packageData = await PackageData.create(source, jsProgram);

            Logger.logInfo("Uploading Package: To S3 and RDS")
            const pack : Package = await PackageCommandController.packageService.uploadPackage(packageData, debloat, name);
            res.status(201).json(pack.getJson());
        } catch (error) {
            if ((error instanceof Error) && (error.message.includes('424'))) {
                Logger.logDebug(error);
                res.status(424).send({description: "Package is not uploaded due to the disqualified rating."});
            } else if ((error instanceof Error) && error.message.includes('400')) {
                Logger.logError("Invalid Request: Not correct format", error);
                res.status(400).json({description: msg_invalid});
            } else if ((error instanceof Error) && error.message.includes('409')){
                Logger.logError("Package already exists", error);
                res.status(409).send({description: "Package already exists"});
            } else {
                Logger.logError("Internal Error while uploading package: ", error);
                res.status(500).send({description: "Internal Server Error"});
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
        // Log request
        Logger.logInfo(`**************************************
                    POST /package/:id`);
        Logger.logDebug(`Request Body: ${JSON.stringify(req.body)}`);
        Logger.logDebug (`Request Params: ${JSON.stringify(req.params)}`);
        Logger.logDebug(`Request query: ${JSON.stringify(req.query)}`);
        Logger.logInfo(`**************************************`);
        
        const msg_invalid = "There is missing field(s) in the PackageID or it is formed improperly, or is invalid."; 
        if (!PackageData.isValidUpdateRequestBody(req.body) || !PackageID.isValidGetByIdRequest(req)) {
            Logger.logInfo(msg_invalid);
            res.status(400).json({description: msg_invalid});
            return;
        }

        // Check if package ID in metadata matches ID in request params
        if (req.body.metadata.ID !== req.params.id) {
            Logger.logInfo(`Package ID does not match ID in request body: ${req.body.metadata.ID} vs ${req.params.id}`);
            res.status(400).json({description: msg_invalid});
            return;
        }

        // Check if package name in metadata matches name in request body
        if (req.body.metadata.Name !== req.body.data.Name) {
            Logger.logInfo(`Package name does not match name in request body: ${req.body.metadata.Name} vs ${req.body.data.Name}`);
            res.status(400).json({description: msg_invalid});
            return;
        }

        // Check if old package id exists:
        const oldID = req.body.metadata.ID;
        if (!(await PackageCommandController.packageService.checkPackageIDExists(oldID))) {
            Logger.logInfo("Package does not exist");
            res.status(404).json({description: "Package does not exist."});
            return;
        }

        // Parse information:
        try {
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
            await PackageCommandController.packageService.updatePackage(packageData, debloat, name, version, oldID);
            res.status(200).json({description: "Version is updated."});

        } catch (error) {
            if ((error instanceof Error) && error.message.includes('404')) {
                Logger.logError("Package does not exist", error);
                res.status(404).json({description: "Package does not exist."});
            } else if ((error instanceof Error) && error.message.includes('400')) {
                Logger.logError("Invalid Request: Not correct format", error);
                res.status(400).json({description: msg_invalid});
            } else if ((error instanceof Error) && error.message.includes('409')){
                Logger.logError("Package already exists", error);
                res.status(409).json({description: "Package already exists."});
            } else {
                Logger.logError("Internal Error while updating package: ", error);
                res.status(500).json({description: "Internal Server Error"});
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
        // Log request
        Logger.logInfo(`**************************************
                    DELETE /reset`);
        Logger.logDebug(`Request Body: ${JSON.stringify(req.body)}`);
        Logger.logDebug (`Request Params: ${JSON.stringify(req.params)}`);
        Logger.logDebug(`Request query: ${JSON.stringify(req.query)}`);
        Logger.logInfo(`**************************************`);

        try {
            await PackageCommandController.packageService.reset();
            res.status(200).send({message: "Registry is reset."});
        } catch (error) {
            Logger.logError("Internal Server Error", error);
            res.status(500).send({description: "Internal Server Error"});
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
        // Log request
        Logger.logInfo(`**************************************
                    DELETE /package/:id`);
        Logger.logDebug(`Request Body: ${JSON.stringify(req.body)}`);
        Logger.logDebug (`Request Params: ${JSON.stringify(req.params)}`);
        Logger.logDebug(`Request query: ${JSON.stringify(req.query)}`);
        Logger.logInfo(`**************************************`);

        const msg_invalid = "There is missing field(s) in the PackageID or it is formed improperly, or is invalid.";
        if (!PackageID.isValidGetByIdRequest(req)) {
            Logger.logInfo(msg_invalid);
            res.status(400).json({description: msg_invalid});
            return;
        }

        try{
            await PackageCommandController.packageService.deletePackageById(req.params.id); 
            
            res.status(200).send({message: "Successfully deleted package via ID."});
            console.log(`Package ${req.params.id} has been successfully deleted.`)
        }catch(error){
            if(error instanceof Error && error.message.includes('404')){
                res.status(404).send({description: 'Package does not exist'});
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
        // Log request
        Logger.logInfo(`**************************************
                    DELETE /package/byName/:name`);
        Logger.logDebug(`Request Body: ${JSON.stringify(req.body)}`);
        Logger.logDebug (`Request Params: ${JSON.stringify(req.params)}`);
        Logger.logDebug(`Request query: ${JSON.stringify(req.query)}`);
        Logger.logInfo(`**************************************`);

        const msg_invalid = "There is missing field(s) in the PackageName or it is formed improperly, or is invalid."
        if (!PackageName.isValidGetByNameRequest(req)) {
            Logger.logInfo(msg_invalid);
            res.status(400).json({description: msg_invalid});
            return;
        }
        
        try{
            await PackageCommandController.packageService.deletePackageByName(req.params.name);

            res.status(200).send({message: "Successfully deleted package via name."})

        }catch(error){
            if(error instanceof Error && error.message.includes('404')) {
                res.status(404).send({description: 'Package does not exist'});
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
        // Log request
        Logger.logInfo(`**************************************
                    PUT /autenticate`);
        Logger.logDebug(`Request Body: ${JSON.stringify(req.body)}`);
        Logger.logDebug (`Request Params: ${JSON.stringify(req.params)}`);
        Logger.logDebug(`Request query: ${JSON.stringify(req.query)}`);
        Logger.logInfo(`**************************************`);

        const msg_invalid = "There is missing field(s) in the AuthenticationRequest or it is formed improperly.";
      
        if (!AuthenticationRequest.isValidRequest(req)) {
            Logger.logInfo(msg_invalid);
            res.status(400).json({description: msg_invalid});
            return;
        }

        try {
            
            let token: string = await PackageCommandController.packageService.createAccessToken(req.body.User.name, req.body.Secret.password);

            res.status(200).send(token);

        } catch(err: any) {

            if (err instanceof Error && err.message.includes('401')) {
                res.status(401).send({description: 'The user or password is invalid.'});
            }
            else if (err instanceof Error && err.message.includes('500')){
                res.status(500).send({description: 'This system does not support authentication.'});
            }
        }
    }


    /* deletePackageByName: Deletes a package by name (all versions)
     * @param req: Request object
     * @param res: Response object
     * 
     * Method: PUT
     * Route: /authenticate
     * 
     * Description: 
     */
    static async registerUser(){

    }

    
}