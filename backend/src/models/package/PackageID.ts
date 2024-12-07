import crypto from 'crypto';
import { Request } from 'express';
import { Logger } from '../../utils/Logger';

export class PackageID {
    private id: string;
    constructor(packageName: string, packageVersion: string) {
        // Create unique identifier number from combination of package name and version
        const data = packageName + packageVersion;

        this.id = crypto.createHash('sha256').update(data).digest('hex');
    }

    static isValidGetByIdRequest (req: Request) {
        if(req.params.id){
            return PackageID.isValidID(req.params.id);
        }
        Logger.logDebug('Invalid ID: ' + req.params.id);
        return false;
    }

    static isValidID(id: string): boolean {
        // only allow alphanumeric characters for sha256 hash
        return /^[a-zA-Z0-9\-]+$/.test(id);
    }

    getId(): string {
        return this.id;
    }
}