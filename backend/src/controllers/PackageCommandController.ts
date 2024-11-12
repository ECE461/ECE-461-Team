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
    static readonly MSG_INVALID = {description: "There is missing field(s) in the PackageQuery/AuthenticationToken or it is formed improperly, or the AuthenticationToken is invalid."};

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
        if (!PackageData.isValidUploadOrUpdateRequest(req.body)) {
            Logger.logInfo("Invalid Request: Not correct format");
            res.status(400).json(PackageCommandController.MSG_INVALID);
            return;
        }

        const source = req.body.URL ? req.body.URL : req.body.Content;
        try {
            Logger.logInfo("Creating Package Data Object")
            const packageData = await PackageData.create(source, req.body.JSProgram);

            Logger.logInfo("Uploading Package: To S3 and RDS")
            const pack : Package = await PackageCommandController.packageService.uploadPackage(packageData);
            res.status(201).json(pack.getJson());
        } catch (error) {
            if ((error instanceof Error) && (error.message === "Package is not uploaded due to the disqualified rating.")) {
                res.status(424).send({description: "Package is not uploaded due to the disqualified rating."});
                return;
            } else if ((error instanceof Error) && error.message.includes('400')) {
                res.status(400).json(PackageCommandController.MSG_INVALID);
            } else if ((error instanceof Error) && error.message.includes('409')){
                res.status(409).send({description: "Package already exists"});
            } else {
                Logger.logDebug(error);
                res.status(500).send({description: "Internal Server Error"});
                return;
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
        if (!PackageData.isValidUploadOrUpdateRequest(req.body)) {
            res.status(400).json(PackageCommandController.MSG_INVALID);
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
            Logger.logDebug(error);
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

        if (!PackageID.isValidGetByIdRequest(req)) {
            res.status(400).json(PackageCommandController.MSG_INVALID);
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

        
        if (!PackageName.isValidGetByNameRequest(req)) {
            res.status(400).json(PackageCommandController.MSG_INVALID);
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
        if (!AuthenticationRequest.isValidRequest(req)) {
            res.status(400).json(PackageCommandController.MSG_INVALID);
            return;
        }
    }
}