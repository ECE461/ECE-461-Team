import crypto from 'crypto';
import { Request } from 'express';

export class PackageID {
    private id: string;
    constructor(packageName: string, packageVersion: string) {
        // Create unique identifier number from combination of package name and version
        const data = packageName + packageVersion;

        this.id = crypto.createHash('sha256').update(data).digest('hex');
    }

    static isValidGetByIdRequest (req: Request) {

        //the only endpoints that have an id are /packages/{id} endpoints, so don't need to consider the possibility that it's in a formatted req body
        const regex = /^[a-zA-Z0-9\-]+$/;

        if(req.params.id){
            return regex.test(req.params.id);
        }
        
        return false;
    }

    getId(): string {
        return this.id;
    }
}