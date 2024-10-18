import { Request, Response } from 'express';
import { PackageService } from '../services/package/PackageService';
import { PackageData } from '../models/package/PackageData';

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
    private packageService = new PackageService();
    static readonly MSG_INVALID = {message: "There is missing field(s) in the PackageQuery/AuthenticationToken or it is formed improperly, or the AuthenticationToken is invalid."};

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
        if (!PackageData.isValidUpdateRequest(req.body)) {
            res.status(400).json(PackageCommandController.MSG_INVALID);
            return;
        }

        const fakeRes = {
            metadata: {
                Name: "React",
                Version: "1.2.3",
                ID: "React1.2.3"
            },
            data: {
                Content: "UEsDBBQAAAAAAA9DQlMAAAAAAAAAAAAAAAALACAAZXhjZXB0aW9ucy9VVA0AB35PWGF+T1hhfk9YYXV4CwABBPcBAAAEFAAAAFBLAwQUAAgACACqMCJTAAAAAAAAAABNAQAAJAAgAGV4Y2VwdGlvbnMvQ29tbWNvdXJpZXJFeGNlcHRpb24uamF2YVVUDQAH4KEwYeGhMGHgoTBhdXgLAAEE9wEAAAQUAAAAdY7NCoMwDMfvfYoct0tfQAYDGbv7BrVmW9DaksQhDN99BSc65gKBwP/jl+R86+4IPgabN/g4MCFbHD0mpdhLYQyFFFl/PIyijpVuzqvYCiVlO5axwWKJdDHUsbVXVEXOTef5MmmoO/LgOycC5dp5WbCAo2LfCFRDrxRwFV7GQJ7E9HSKsMUCf/0w+2bSHuPwN3vMFPiMPkjsVoTTHmcyk3kDUEsHCOEX4+uiAAAATQEAAFBLAwQUAAgACACqMCJTAAAAAAAAAAB9AgAAKgAgAGV4Y2VwdGlvbnMvQ29tbWNvdXJpZXJFeGNlcHRpb25NYXBwZXIuamF2YVVUDQAH4KEwYeGhMGHgoTBhdXgLAAEE9wEAAAQUAAAAdVHNTsMwDL7nKXzcJOQXKKCJwYEDAiHxACY1U0bbRI7bVUJ7d7JCtrbbIkVx4u/HdgLZb9owWF9j2rX1rTgW5N5yUOebWBjj6uBFzzDCUUnUfZHViA8U+Z1jSBQurlFadZVTxxEz9CO9jDy21FGPrtmyVXwejmKa20WUmESF8cxujOBe8Sl38UIhsFzFvYnvXHkAmFWOTWg/K2fBVhQjrE9NzEQhaVZcc6MRZqnbS6x7+DEG0lr9tTfEk2mAzGYzoF87FkmFDbf/2jIN1OdwcckTuF9m28Ma/9XRDe6g4d0kt1gWJ5KwttJMi8M2lKRH/CMpLTLgJrnihjUn175Mgllxb/bmF1BLBwiV8DzjBgEAAH0CAABQSwMEFAAIAAgAD0NCUwAAAAAAAAAAGQMAACYAIABleGNlcHRpb25zL0dlbmVyaWNFeGNlcHRpb25NYXBwZXIuamF2YVVUDQAHfk9YYX9PWGF+T1hhdXgLAAEE9wEAAAQUAAAAjVNRa8IwEH7Prwg+VZA87a3bcJsyBhNHx9hzTE+Npk25XG3Z8L8v7ZbaKsICaS6977vvu6QtpNrLDXBlM+FnpmyJGlBAraAgbXMXM6azwiJdYBAcSSS9loqceJQOEnCFp0D8P0qAP9n0OqUkbTRpOME//JuerZ08yFrofAeKxEu7xMNc5QQ6XxRBXDjsI6AmMQ+NL2RRAF7FvaE96LQHMDZb2X2TA8yFM+ubnXhvnt7ptA3YNJBYUa6MVlwZ6Rx/hhxQqzNl7usayCAnx89St93+nn8zxv2Y/jbexoNz4nh2ai16eQBE76Td/ZkJNE42hFEnxKEeB61m9G+7k+B3PIdqkIvG8Ylk7EZ4XYvR6KGpGGpX0nHaoq3y0aQR6lEQqMR82IQoi1RSJzGTJD81bWfgFOq2YhTwE97/xsQ8SZZJIyE2QK9WSaO/IF2Ac/4fiMZB+MiO7AdQSwcIIu3xZlgBAAAZAwAAUEsBAhQDFAAAAAAAD0NCUwAAAAAAAAAAAAAAAAsAIAAAAAAAAAAAAO1BAAAAAGV4Y2VwdGlvbnMvVVQNAAd+T1hhfk9YYX5PWGF1eAsAAQT3AQAABBQAAABQSwECFAMUAAgACACqMCJT4Rfj66IAAABNAQAAJAAgAAAAAAAAAAAApIFJAAAAZXhjZXB0aW9ucy9Db21tY291cmllckV4Y2VwdGlvbi5qYXZhVVQNAAfgoTBh4aEwYeChMGF1eAsAAQT3AQAABBQAAABQSwECFAMUAAgACACqMCJTlfA84wYBAAB9AgAAKgAgAAAAAAAAAAAApIFdAQAAZXhjZXB0aW9ucy9Db21tY291cmllckV4Y2VwdGlvbk1hcHBlci5qYXZhVVQNAAfgoTBh4aEwYeChMGF1eAsAAQT3AQAABBQAAABQSwECFAMUAAgACAAPQ0JTIu3xZlgBAAAZAwAAJgAgAAAAAAAAAAAApIHbAgAAZXhjZXB0aW9ucy9HZW5lcmljRXhjZXB0aW9uTWFwcGVyLmphdmFVVA0AB35PWGF/T1hhfk9YYXV4CwABBPcBAAAEFAAAAFBLBQYAAAAABAAEALcBAACnBAAAAAA="
            }
        }
        res.status(201).json(fakeRes);
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
        res.status(200).send({message: "Version is updated."});
        // res.status(400).send(PackageCommandController.MSG_INVALID);
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
        res.status(200).send({message: "Registry is reset."});
        // res.status(400).send(PackageCommandController.MSG_INVALID);
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
        res.status(200).send({message: "Package is deleted."});
        // res.status(400).send(PackageCommandController.MSG_INVALID);
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
        res.status(200).send({message: "Package is deleted."});
        // res.status(400).send(PackageCommandController.MSG_INVALID);
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
        
        const fakeRes = {
            value: '"bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"'
        }
        res.status(200).json(fakeRes);
        // res.status(400).send(PackageCommandController.MSG_INVALID);
    }
}