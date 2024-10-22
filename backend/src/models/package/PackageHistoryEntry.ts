import { User } from "../authentication/User";
import { PackageMetadata } from "./PackageMetadata";


export class PackageHistoryEntry {

    static Action = class {
        static CREATE = "CREATE";
        static UPDATE = "UPDATE";
        static DOWNLOAD = "DOWNLOAD";
        static RATE = "RATE";
    }
    
    private user: User;
    private date: string; // ex: 2023-03-23T23:11:15Z
    private metadata: PackageMetadata;
    private action: string;

    constructor(user: User, date: string, metadata: PackageMetadata, action: string) {
        // TODO: might change this to something that pools from database???
        this.user = user;
        this.date = date;
        this.metadata = metadata;
        this.action = action;
    }

    getJson() {
        return {
            User: this.user.getJson(),
            Date: this.date,
            PackageMetadata: this.metadata.getJson(),
            Action: this.action
        }
    }
}
