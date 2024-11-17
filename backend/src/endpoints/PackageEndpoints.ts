import { Router } from 'express';
import { PackageCommandController } from '../controllers/PackageCommandController';
import { PackageQueryController } from '../controllers/PackageQueryController'
import { FakeController } from '../controllers/FakeController';

/**
 * @class PackageEndpoints
 * @description Initializes all endpoints for the package service
 * @method getRouter: Returns the router object with defined endpoints
 * @method initalizeRoutes: Initializes all endpoints for the package service
 * @method initializeFakeRoutes: Initializes all endpoints for the package service with fake data
 */
export class PackageEndpoints {
    public router: Router;

    // Initialize router and endpoints
    constructor() {
        this.router = Router();
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
    private initalizeRoutes() {

        // READ-ONLY Endpoints -----------------------------------------------------------------------------------------------------------------
        // Returns all meta-data of all packages fitting query (SEARCH BY QUERY)
        this.router.post('/packages', PackageQueryController.getPackagesByQuery); // (BASELINE)

        // Return PackageMetadata of all packages that match the regex (SEARCH BY REGEX)
        this.router.post('/package/byRegEx', PackageQueryController.getPackagesByRegex); // (BASELINE)

        // Returns package information (metadata + data) for specific ID (DOWNLOAD)
        this.router.get('/package/:id', PackageQueryController.getPackageById); // (BASELINE)

        // Get ratings for package with specific ID (RATING)
        this.router.get('/package/:id/rate', PackageQueryController.getRating); // (BASELINE)

        // Get cost for package with specific ID (COST)
        this.router.get('/package/:id/cost', PackageQueryController.getCost); // (NON-BASELINE)

        // Given ID, return history of package for all versions (HISTORY) (extension)
        this.router.get('/package/byName/:name', PackageQueryController.getPackageHistoryByName); // (NON-BASELINE)
        this.router.get('/tracks', PackageQueryController.getTracks); // (BASELINE)


        // READ-WRITE Endpoints -----------------------------------------------------------------------------------------------------------------

        // Updates stored package information for specific Package ID (UPDATE)
        this.router.post('/package/:id', PackageCommandController.updatePackage); // (BASELINE)
        
        // User gives Content (base-64 encoded zipped content) or Package URL, and JSProgram (Extension)
        // Stores package as PackageMetadata + PackageData (UPLOAD/INGEST)
        this.router.post('/package', PackageCommandController.uploadPackage); // (BASELINE)

        // Reset database (RESET)
        this.router.delete('/reset', PackageCommandController.reset); // (BASELINE)

        // Deletes package with specific ID (DELETE BY ID)
        this.router.delete('/package/:id', PackageCommandController.deletePackageById); // (NON-BASELINE)

        // Given package name (DELETE ALL VERSIONS)
        this.router.delete('/package/byName/:name', PackageCommandController.deletePackageByName); // (NON-BASELINE)
        
        // Given User name, password, and isAdmin value + password, returns an AuthenticationToken (CREATE USER)
        this.router.put('/authenticate', PackageCommandController.createAccessToken); // (NON-BASELINE)
    }

    /**
     * @method initializeFakeRoutes
     * @description Initializes all endpoints for the package service with fake data
     *              Used for testing purposes with frontend
     */
    private initializeFakeRoutes() {
        this.router.post('/packages', FakeController.getPackagesByQuery); // (BASELINE)
        this.router.post('/package/byRegEx', FakeController.getPackagesByRegex); // (BASELINE)
        this.router.get('/package/:id', FakeController.getPackageById); // (BASELINE)
        this.router.get('/package/:id/rate', FakeController.getRating); // (BASELINE)
        this.router.get('/package/:id/cost', FakeController.getCost); // (NON-BASELINE)
        this.router.get('/package/byName/:name', FakeController.getPackageHistoryByName); // (NON-BASELINE)
        this.router.put('/package/:id', FakeController.updatePackage); // (BASELINE)
        this.router.post('/package/:id', FakeController.updatePackage); // (BASELINE)
        this.router.post('/package', FakeController.uploadPackage); // (BASELINE)
        this.router.delete('/reset', FakeController.reset); // (BASELINE)
        this.router.delete('/package/:id', FakeController.deletePackageById); // (NON-BASELINE)
        this.router.delete('/package/byName/:name', FakeController.deletePackageByName); // (NON-BASELINE)
        this.router.put('/authenticate', FakeController.createAccessToken);
        this.router.get('/tracks', PackageQueryController.getTracks); // (BASELINE)
        this.router.get('/package/:id/cost', FakeController.getCost); // (BASELINE)

        // TODO: Add user endpoints
    }

    // Returns router to be used in backend/src/index.ts
    public getRouter(): Router {
        return this.router;
    }
}
