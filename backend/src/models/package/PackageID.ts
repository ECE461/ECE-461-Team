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
        // TODO: Add logic
        return true;
    }

    getId(): string {
        return this.id;
    }
}