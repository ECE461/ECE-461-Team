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
            "BusFactor": 0.1,
            "BusFactorLatency": 0.1,
            "Correctness": 0.1,
            "CorrectnessLatency": 0.1,
            "RampUp": 0.1,
            "RampUpLatency": 0.1,
            "ResponsiveMaintainer": 0.1,
            "ResponsiveMaintainerLatency": 0.1,
            "LicenseScore": 0.1,
            "LicenseScoreLatency": 0.1,
            "GoodPinningPractice": 0.1,
            "GoodPinningPracticeLatency": 0.1,
            "PullRequest": 0.1,
            "PullRequestLatency": 0.1,
            "NetScore": 0.1,
            "NetScoreLatency": 0.1
          }
        res.status(200).json(fakeRes);
        
    }

    static getPackageHistoryByName(req: Request, res: Response) {
        const msg_invalid = "There is missing field(s) in the PackageID or it is formed improperly, or is invalid.";
        if (!PackageName.isValidGetByNameRequest(req)) {
            res.status(400).json({description: msg_invalid});
            return;
        }

        const user = new User("James Davis", true);
        const metadata = new PackageMetadata("React", "2.2.3");
        const entry1 = new PackageHistoryEntry(user, new Date().toISOString(), metadata, PackageHistoryEntry.Action.CREATE);
        const entry2 = new PackageHistoryEntry(user, new Date().toISOString(), metadata, PackageHistoryEntry.Action.RATE);
        const entry3 = new PackageHistoryEntry(user, new Date().toISOString(), metadata, PackageHistoryEntry.Action.UPDATE);
        const entry4 = new PackageHistoryEntry(user, new Date().toISOString(), metadata, PackageHistoryEntry.Action.DOWNLOAD);

        const fakeRes = [entry4.getJson(), entry3.getJson(), entry2.getJson(), entry1.getJson()];
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

        if (req.query.dependency) {
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