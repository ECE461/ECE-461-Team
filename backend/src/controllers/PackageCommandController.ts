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
     * TODO: should we rate all packages here and store for later?
     */
    static async uploadPackage(req: Request, res: Response) {
        const msg_invalid = "There is missing field(s) in the PackageData or it is formed improperly (e.g. Content and URL ar both set)";
        // Check if request is valid + has all required fields
        if (!PackageData.isValidUploadRequestBody(req.body)) {
            Logger.logInfo(msg_invalid);
            res.status(400).json({description: msg_invalid});
            return;
        }

        const source = req.body.URL ? req.body.URL : req.body.Content;
        try {
            Logger.logInfo("Creating Package Data Object")
            const jsProgram : string = req.body.JSProgram ? req.body.JSProgram : "";
            const packageData = await PackageData.create(source, jsProgram);

            Logger.logInfo("Uploading Package: To S3 and RDS")
            const pack : Package = await PackageCommandController.packageService.uploadPackage(packageData);
            res.status(201).json(pack.getJson());
        } catch (error) {
            if ((error instanceof Error) && (error.message === "Package is not uploaded due to the disqualified rating.")) {
                Logger.logDebug(error);
                res.status(424).send({description: "Package is not uploaded due to the disqualified rating."});
            } else if ((error instanceof Error) && error.message.includes('400')) {
                Logger.logError("Invalid Request: Not correct format", error);
                res.status(400).json({description: msg_invalid});
            } else if ((error instanceof Error) && error.message.includes('409')){
                Logger.logError("Package already exists", error);
                res.status(409).send({description: "Package already exists"});
            } else {
                Logger.logError("Internal Error hile uploading package: ", error);
                res.status(500).send({description: "Internal Server Error"});
            }
        }
    }

    /* updatePackage: Updates package with new package content
     * @param req: Request object
     * @param res: Response object
     * 
     * Method: PUT
     * Route: /package/{id}
     * 
     * Description: User gives id of package in params + Package information (see models/package/Package.ts) in req body
     * Updates database/storage with new package information
     * Sets response status to 200 (success), 400 (invalid request), 404 (package does not exist)
     */
    static async updatePackage(req: Request, res: Response) {     
        const msg_invalid = "There is missing field(s) in the PackageID or it is formed improperly, or is invalid."; 
        if (!PackageData.isValidUpdateRequestBody(req.body) || !PackageID.isValidGetByIdRequest(req)) {
            Logger.logInfo(msg_invalid);
            res.status(400).json({description: msg_invalid});
            return;
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
        // TODO: Add validity check
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
     * Method: POST
     * Route: /register
     * 
     * Description: allows admins to register 
     */
    static async registerUser(req: Request, res: Response){

        const msg_invalid = "There is missing field(s) in the AuthenticationRequest or it is formed improperly.";

        if (!AuthenticationRequest.isValidRequest(req) || !AuthenticationRequest.isValidToken(req)) {
            Logger.logInfo(msg_invalid);
            res.status(400).json({description: msg_invalid});
            return;
        }

        try{ 
            await PackageCommandController.packageService.registerUser(req.body.User.name, req.body.User.isAdmin, req.body.Secret.password)
            res.status(200).send({ message: 'User successfully registered' });

        } catch (err: any){
            if (err instanceof Error && err.message.includes('401')) {
                res.status(409).send({description: 'User has already been registered'});
            }
            else if (err instanceof Error && err.message.includes('500')){
                res.status(500).send({description: 'Error registering user.'});
            }
        }
        
    }

    
}