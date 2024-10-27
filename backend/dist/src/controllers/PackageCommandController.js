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
exports.PackageCommandController = void 0;
const PackageService_1 = require("../services/package/PackageService");
const PackageData_1 = require("../models/package/PackageData");
const Logger_1 = require("../utils/Logger");
const PackageID_1 = require("../models/package/PackageID");
const PackageName_1 = require("../models/package/PackageName");
const AuthenticationRequest_1 = require("../models/authentication/AuthenticationRequest");
/* PackageCommandController: Handles all API actions that modify state (delete, update), sets "res" status and data
 * Handles Initial Request Validation
 * @method: uploadPackage
 * @method: updatePackage
 * @method: reset
 * @method: deletePackageById
 * @method: deletePackageByName
 * @method: createAccessToken
 */
class PackageCommandController {
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
    static uploadPackage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // if (!PackageData.isValidUploadOrUpdateRequest(req.body)) {
            //     Logger.logInfo("Invalid Request: Not correct format");
            //     res.status(400).json(PackageCommandController.MSG_INVALID);
            //     return;
            // }
            // const source = req.body.URL ? req.body.URL : req.body.Content;
            // try {
            //     Logger.logInfo("Creating Package Data Object")
            //     const packageData = await PackageData.create(source, req.body.JSProgram);
            //     Logger.logInfo("Uploading Package: To S3 and RDS")
            //     const pack : Package = await PackageCommandController.packageService.uploadPackage(packageData);
            //     res.status(201).json(pack.getJson());
            // } catch (error) {
            //     if ((error instanceof Error) && (error.message === "Package is not uploaded due to the disqualified rating.")) {
            //         res.status(424).send({description: "Package is not uploaded due to the disqualified rating."});
            //         return;
            //     } else if ((error instanceof Error) && error.message.includes('400')) {
            //         res.status(400).json(PackageCommandController.MSG_INVALID);
            //     } else if ((error instanceof Error) && error.message.includes('409')){
            //         res.status(409).send({description: "Package already exists"});
            //     } else {
            //         Logger.logDebug(error);
            //         res.status(500).send({description: "Internal Server Error"});
            //         return;
            //     }
            // }
        });
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
    static updatePackage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!PackageData_1.PackageData.isValidUploadOrUpdateRequest(req.body)) {
                res.status(400).json(PackageCommandController.MSG_INVALID);
                return;
            }
        });
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
    static reset(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: Add validity check
            try {
                yield PackageCommandController.packageService.reset();
                res.status(200).send({ message: "Registry is reset." });
            }
            catch (error) {
                Logger_1.Logger.logDebug(error);
                res.status(500).send({ description: "Internal Server Error" });
            }
        });
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
    static deletePackageById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!PackageID_1.PackageID.isValidGetByIdRequest(req)) {
                res.status(400).json(PackageCommandController.MSG_INVALID);
                return;
            }
        });
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
    static deletePackageByName(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!PackageName_1.PackageName.isValidGetByNameRequest(req)) {
                res.status(400).json(PackageCommandController.MSG_INVALID);
                return;
            }
        });
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
    static createAccessToken(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!AuthenticationRequest_1.AuthenticationRequest.isValidRequest(req)) {
                res.status(400).json(PackageCommandController.MSG_INVALID);
                return;
            }
        });
    }
}
exports.PackageCommandController = PackageCommandController;
PackageCommandController.packageService = new PackageService_1.PackageService();
PackageCommandController.MSG_INVALID = { description: "There is missing field(s) in the PackageQuery/AuthenticationToken or it is formed improperly, or the AuthenticationToken is invalid." };
