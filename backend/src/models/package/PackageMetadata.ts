import { PackageName } from "./PackageName";
import { PackageVersion } from "./PackageVersion";
import { PackageID } from "./PackageID";

export interface IPackageMetadata {
    Name: string;
    Version: string;
    ID: string;
}

/* PackageMetadata: Class to represent package metadata
 * Contains: name, version, and id
 */
export class PackageMetadata{
    private name: PackageName; // ex: "package-name"
    private version: PackageVersion; // ex: "1.0.0"
    private id: PackageID; // ex: "123456789"
    private url?: string;
    private readMe: string = '';
    
    /* Constructor
     * @param name: string - name of the package
     * @param version: string - version of the package
     */
    constructor (name: string, version: string) {
        this.name = new PackageName(name);
        this.version = new PackageVersion(version);
        this.id = new PackageID(name, version);
    }

    setUrl(url: string) {
        if (!url) {
            throw new Error('URL cannot be empty');
        }
        this.url = url;
    }

    setReadMe(readMe: string) {
        this.readMe = readMe;
    }

    setVersion(version: string) {
        this.version = new PackageVersion(version);
    }

    // getName : Returns name of the package
    getName(): string {
        return this.name.getName();
    }

    // getVersion : Returns version of the package
    getVersion(): string {
        return this.version.getVersion();
    }

    // getId : Returns ID of the package
    getId(): string {
        return this.id.getId();
    }

    // getJson : Returns JSON representation of the package metadata
    getJson() {
        return {
            Name: this.name.getName(),
            Version: this.version.getVersion(),
            ID: this.id.getId()
        }
    }

    getUrl(): string {
        if (!this.url) {
            throw new Error('URL not set');
        }
        return this.url;
    }

    getReadMe(): string {
        if (!this.readMe) {
            return "";
        }
        return this.readMe;
    }
}