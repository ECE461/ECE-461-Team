"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageEndpoints = void 0;
const express_1 = require("express");
const PackageCommandController_1 = require("../controllers/PackageCommandController");
const PackageQueryController_1 = require("../controllers/PackageQueryController");
const FakeController_1 = require("../controllers/FakeController");
/**
 * @class PackageEndpoints
 * @description Initializes all endpoints for the package service
 * @method getRouter: Returns the router object with defined endpoints
 * @method initalizeRoutes: Initializes all endpoints for the package service
 * @method initializeFakeRoutes: Initializes all endpoints for the package service with fake data
 */
class PackageEndpoints {
    // Initialize router and endpoints
    constructor() {
        this.router = (0, express_1.Router)();
        if (process.env.NODE_ENV === 'FAKE_SUCCESS') {
            this.initializeFakeRoutes();
        }
        else {
            this.initalizeRoutes();
        }
    }
    /**
     * @method initalizeRoutes
     * @description Initializes all endpoints for the package service.
     *              Separated as READ-ONLY and READ-WRITE endpoints
     */
    initalizeRoutes() {
        // READ-ONLY Endpoints -----------------------------------------------------------------------------------------------------------------
        // Returns all meta-data of all packages fitting query (SEARCH BY QUERY)
        this.router.post('/packages', PackageQueryController_1.PackageQueryController.getPackagesByQuery); // (BASELINE)
        // Return PackageMetadata of all packages that match the regex (SEARCH BY REGEX)
        this.router.post('/package/byRegEx', PackageQueryController_1.PackageQueryController.getPackagesByRegex); // (BASELINE)
        // Returns package information (metadata + data) for specific ID (DOWNLOAD)
        this.router.get('/package/:id', PackageQueryController_1.PackageQueryController.getPackageById); // (BASELINE)
        // Get ratings for package with specific ID (RATING)
        this.router.get('/package/:id/rate', PackageQueryController_1.PackageQueryController.getRating); // (BASELINE)
        // Given ID, return history of package for all versions (HISTORY) (extension)
        this.router.get('/package/byName/:name', PackageQueryController_1.PackageQueryController.getPackageHistoryByName); // (NON-BASELINE)
        // READ-WRITE Endpoints -----------------------------------------------------------------------------------------------------------------
        // Updates stored package information for specific Package ID (UPDATE)
        this.router.put('/package/:id', PackageCommandController_1.PackageCommandController.updatePackage); // (BASELINE)
        // User gives Content (base-64 encoded zipped content) or Package URL, and JSProgram (Extension)
        // Stores package as PackageMetadata + PackageData (UPLOAD/INGEST)
        this.router.post('/package', PackageCommandController_1.PackageCommandController.uploadPackage); // (BASELINE)
        // Reset database (RESET)
        this.router.delete('/reset', PackageCommandController_1.PackageCommandController.reset); // (BASELINE)
        // Deletes package with specific ID (DELETE BY ID)
        this.router.delete('/package/:id', PackageCommandController_1.PackageCommandController.deletePackageById); // (NON-BASELINE)
        // Given package name (DELETE ALL VERSIONS)
        this.router.delete('/package/byName/:name', PackageCommandController_1.PackageCommandController.deletePackageByName); // (NON-BASELINE)
        // Given User name, password, and isAdmin value + password, returns an AuthenticationToken (CREATE USER)
        this.router.put('/authenticate', PackageCommandController_1.PackageCommandController.createAccessToken); // (NON-BASELINE)
    }
    /**
     * @method initializeFakeRoutes
     * @description Initializes all endpoints for the package service with fake data
     *              Used for testing purposes with frontend
     */
    initializeFakeRoutes() {
        this.router.post('/packages', FakeController_1.FakeController.getPackagesByQuery); // (BASELINE)
        this.router.post('/package/byRegEx', FakeController_1.FakeController.getPackagesByRegex); // (BASELINE)
        this.router.get('/package/:id', FakeController_1.FakeController.getPackageById); // (BASELINE)
        this.router.get('/package/:id/rate', FakeController_1.FakeController.getRating); // (BASELINE)
        this.router.get('/package/byName/:name', FakeController_1.FakeController.getPackageHistoryByName); // (NON-BASELINE)
        this.router.put('/package/:id', FakeController_1.FakeController.updatePackage); // (BASELINE)
        this.router.post('/package', FakeController_1.FakeController.uploadPackage); // (BASELINE)
        this.router.delete('/reset', FakeController_1.FakeController.reset); // (BASELINE)
        this.router.delete('/package/:id', FakeController_1.FakeController.deletePackageById); // (NON-BASELINE)
        this.router.delete('/package/byName/:name', FakeController_1.FakeController.deletePackageByName); // (NON-BASELINE)
        this.router.put('/authenticate', FakeController_1.FakeController.createAccessToken);
    }
    // Returns router to be used in backend/src/index.ts
    getRouter() {
        return this.router;
    }
}
exports.PackageEndpoints = PackageEndpoints;
