import { PackageID } from '../models/package/PackageID';
import { PackageMetadata } from '../models/package/PackageMetadata';
import { PackageData } from '../models/package/PackageData';
import { Request, Response } from 'express';
import { PackageCommandController } from './PackageCommandController';
import { PackageQueryController } from './PackageQueryController';
import { PackageQuery } from '../models/package/PackageQuery';
import { PackageRegex } from '../models/package/PackageRegex';
import { Package } from '../models/package/Package';
import { User } from '../models/authentication/User';
import { PackageHistoryEntry } from '../models/package/PackageHistoryEntry';
import { PackageName } from '../models/package/PackageName';
import { AuthenticationRequest } from '../models/authentication/AuthenticationRequest';

export class FakeController {
    static readonly FAKE_CONTENT = "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";
   
    static getPackagesByQuery(req: Request, res: Response) {
        // Query Validation
        const msg_invalid = "There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid."
        // Package Query Validation
        if (!PackageQuery.isValidQuery(req)) {
            res.status(400).json({description: msg_invalid});
            return;
        }

        const m1 = new PackageMetadata("React", "2.2.3");
        const m2 = new PackageMetadata("Lodash", "1.2.4");
        const m3 = new PackageMetadata("React", "1.2.5");
        const response = [ m1.getJson(), m2.getJson(), m3.getJson() ];
        res.status(200).json(response);
    }

    static getPackagesByRegex(req: Request, res: Response) {
        const msg_invalid = "There is missing field(s) in the PackageRegEx or it is formed improperly, or is invalid";
        if (!PackageRegex.isValidRegexRequest(req)) {
            res.status(400).json({description: msg_invalid});
            return;
        }

        const m1 = new PackageMetadata("React", "2.2.3");
        const m2 = new PackageMetadata("Lodash", "1.2.4");
        const m3 = new PackageMetadata("React", "1.2.5");
        const response = [ m1.getJson(), m2.getJson(), m3.getJson() ];
        res.status(200).json(response);
    }

   static async getPackageById(req: Request, res: Response) {
        const msg_invalid = "There is missing field(s) in the PackageID or it is formed improperly, or is invalid.";
        if (!PackageID.isValidGetByIdRequest(req)) {
            res.status(400).json({description: msg_invalid});
            return;
        }

        const metadata = new PackageMetadata("React", "1.2.3");
        const data = await PackageData.create(FakeController.FAKE_CONTENT, "");
        const pckg = new Package(metadata, data);
        res.status(200).json(pckg.getJson());
    }

    static getRating(req: Request, res: Response) {

        const msg_invalid = "There is missing field(s) in the PackageID";
        if (!PackageID.isValidGetByIdRequest(req)) {
            res.status(400).json({description: msg_invalid});
            return;
        }

        const fakeRes ={
            "BusFactor": 1,
            "BusFactorLatency": 2,
            "Correctness": 3,
            "CorrectnessLatency": 4,
            "RampUp": 5,
            "RampUpLatency": 6,
            "ResponsiveMaintainer": 7,
            "ResponsiveMaintainerLatency": 8,
            "LicenseScore": 9,
            "LicenseScoreLatency": 10,
            "GoodPinningPractice": 11,
            "GoodPinningPracticeLatency": 12,
            "PullRequest": 13,
            "PullRequestLatency": 14,
            "NetScore": 15,
            "NetScoreLatency": 16
          }
        res.status(200).json(fakeRes);
        
    }

    static updatePackage(req: Request, res: Response) {
        const msg_invalid = "There is missing field(s) in the PackageID or it is formed improperly, or is invalid."; 
        if (!PackageData.isValidUpdateRequestBody(req.body) || !PackageID.isValidGetByIdRequest(req)) {
            res.status(400).json({description: msg_invalid});
            return;
        }

        res.status(200).send({description: "Version is updated."});
    }

    static async uploadPackage(req: Request, res: Response) {
        const msg_invalid = "There is missing field(s) in the PackageData or it is formed improperly (e.g. Content and URL ar both set)";
        // Check if request is valid + has all required fields
        if (!PackageData.isValidUploadRequestBody(req.body)) {
            res.status(400).json({description: msg_invalid});
            return;
        }

        const metadata = new PackageMetadata("React", "1.2.3");
        const data = await PackageData.create(FakeController.FAKE_CONTENT, "");
        const pckg = new Package(metadata, data);
        res.status(201).json(pckg.getJson());
    }

    static reset(req: Request, res: Response) {
        // TODO: Add validity check
        res.status(200).send({description: "Registry is reset."});
    }

    static deletePackageById(req: Request, res: Response) {
        const msg_invalid = "There is missing field(s) in the PackageID or it is formed improperly, or is invalid.";
        if (!PackageID.isValidGetByIdRequest(req)) {
            res.status(400).json({description: msg_invalid});
            return;
        }
        res.status(200).send({description: "Package is deleted."});
    }

    static deletePackageByName(req: Request, res: Response) {
        const msg_invalid = "There is missing field(s) in the PackageName or it is formed improperly, or is invalid."
        if (!PackageName.isValidGetByNameRequest(req)) {
            res.status(400).json({description: msg_invalid});
            return;
        }

        res.status(200).send({description: "Package is deleted."});
    }

    static createAccessToken(req: Request, res: Response) {
        const msg_invalid = "There is missing field(s) in the AuthenticationRequest or it is formed improperly.";
        if (!AuthenticationRequest.isValidRequest(req)) {
            res.status(400).json({description: msg_invalid});
            return;
        }

        const fakeRes = {
            value: '"bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"'
        }
        res.status(200).json(fakeRes);
    }


    static registerUser(req: Request, res: Response){
        const msg_invalid = "There is missing field(s) in the AuthenticationRequest or it is formed improperly.";
        if (!AuthenticationRequest.isValidRequest(req)) {
            res.status(400).json({description: msg_invalid});
            return;
        }

        const fakeRes = {
            message: 'User successfully registered.'
        }
        
        res.status(200).json(fakeRes); 
    }
  
    static getCost(req: Request, res: Response) {
        const msg_invalid = "There is missing field(s) in the PackageID or it is formed improperly, or is invalid.";
        if (!PackageID.isValidGetByIdRequest(req)) {
            res.status(400).json({description: msg_invalid});
            return;
        }

        if (req.query.dependency == undefined) {
            res.status(400).json({description: "Dependency not found"});
            return;
        }

        if (req.query.dependency == "false") {
            const resp = {
                "357898765": {
                  "standaloneCost": 50,
                  "totalCost": 95
                },
                "988645763": {
                  "standaloneCost": 20,
                  "totalCost": 45
                }
            }
            res.status(200).json(resp);
            return;
        }    
        else {
            const resp = {
                "357898765": {
                  "totalCost": 50
                }
            }
            res.status(200).json(resp);
        }       
    }
}