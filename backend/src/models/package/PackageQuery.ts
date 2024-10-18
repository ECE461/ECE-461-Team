import { PackageName } from './PackageName';
import { PackageVersionQuery } from './PackageVersionQuery';
import { PackageVersion } from './PackageVersion';
import { PackageMetadata } from './PackageMetadata';
import Joi from 'joi';

export class PackageQuery {
    private name: PackageName;
    private versionQuery: PackageVersionQuery;

    private static packageQuerySchema = Joi.array().items(
        Joi.object({
            name: Joi.string().required(),
            version: Joi.string().required(),
        })
    ).required();

    constructor(name: string, versionQuery: string) {
        this.name = new PackageName(name);
        this.versionQuery = new PackageVersionQuery(versionQuery);
    }

    static isValidQuery(reqBody: any) : boolean {
        const { error } = PackageQuery.packageQuerySchema.validate(reqBody);
        if (error) {
            return false;
        }
        return true;
    }

    isValid(): boolean {
        return this.name.isValid() && this.versionQuery.isValid();
    }

    checkMatches(packetMetadata: PackageMetadata): boolean {
        if (this.name.getName() === "*") {
            return true;
        }
        return this.name.matches(packetMetadata.getName()) && this.versionQuery.matches(packetMetadata.getVersion());
    }

    getJson() {
        return {
            Version: this.versionQuery.getPackageVersionQuery(),
            Name: this.name.getName()
        }
    }

}