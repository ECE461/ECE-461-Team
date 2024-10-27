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
exports.PackageQueryController = void 0;
const PackageService_1 = require("../services/package/PackageService");
const PackageQuery_1 = require("../models/package/PackageQuery");
const PackageRegex_1 = require("../models/package/PackageRegex");
const PackageID_1 = require("../models/package/PackageID");
const PackageName_1 = require("../models/package/PackageName");
/* PackageQueryController: Handles all API calls for read-only actions, sets "res" status and data
 * Handles Initial Request Validation
 * @method: getPackagesByQuery
 * @method: getPackagesByRegex
 * @method: getPackageById
 * @method: getRating
 * @method: getPackageHistoryByName
 */
class PackageQueryController {
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
    static getPackagesByQuery(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Package Query Validation
                if (!PackageQuery_1.PackageQuery.isValidQuery(req)) {
                    res.status(400).json(PackageQueryController.MSG_INVALID);
                    return;
                }
                // Call PackageService to handle business logic
                const offset = req.query.offset ? Number(req.query.offset) : 0;
                const packages = yield PackageQueryController.packageService.getPackagesByQuery(req.body, offset);
                res.setHeader('offset', (offset + packages.length).toString());
                res.status(200).json(packages);
            }
            catch (error) {
                console.error('Error fetching patches: ', error);
                res.status(500).send({ message: "Internal Server Error" });
            }
        });
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
    static getPackagesByRegex(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!PackageRegex_1.PackageRegex.isValidRegexRequest(req)) {
                res.status(400).json(PackageQueryController.MSG_INVALID);
                return;
            }
        });
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
    static getPackageById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!PackageID_1.PackageID.isValidGetByIdRequest(req)) {
                    res.status(400).json(PackageQueryController.MSG_INVALID);
                    return;
                }
            }
            catch (Error) {
            }
        });
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
    static getRating(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!PackageID_1.PackageID.isValidGetByIdRequest(req)) {
                res.status(400).json(PackageQueryController.MSG_INVALID);
                return;
            }
        });
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
    static getPackageHistoryByName(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!PackageName_1.PackageName.isValidGetByNameRequest(req)) {
                res.status(400).json(PackageQueryController.MSG_INVALID);
                return;
            }
        });
    }
}
exports.PackageQueryController = PackageQueryController;
PackageQueryController.packageService = new PackageService_1.PackageService();
PackageQueryController.MSG_INVALID = { message: "There is missing field(s) in the PackageQuery/AuthenticationToken or it is formed improperly, or the AuthenticationToken is invalid." };
