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
            Name: Joi.string().
                required()
                .custom((value, helpers) => {
                    value = value.replace(/\s/g, '');
                    if (!PackageName.isValidName(value)) {
                        return helpers.error('any.invalid');
                    }
                    return value;
                }),
            Version: Joi.string()
                .required()
                .custom((value, helpers) => {
                    value = value.replace(/\s/g, '');
                    if (!PackageVersionQuery.isValidVersionQuery(value)) {
                        return helpers.error('any.invalid');
                    }
                    return value;
                }),
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
        return PackageName.isValidName(this.name.getName()) && PackageVersion.isValidVersion(this.versionQuery.getVersionQuery());
    }

    checkMatches(packetMetadata: PackageMetadata): boolean {
        if (this.name.getName() === "*") {
            return true;
        }
        return this.name.matches(packetMetadata.getName()) && this.versionQuery.matches(packetMetadata.getVersion());
    }

    getJson() {
        return {
            Version: this.versionQuery.getVersionQuery(),
            Name: this.name.getName()
        }
    }

}