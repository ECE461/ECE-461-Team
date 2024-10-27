"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageHistoryEntry = void 0;
class PackageHistoryEntry {
    constructor(user, date, metadata, action) {
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
        };
    }
}
exports.PackageHistoryEntry = PackageHistoryEntry;
PackageHistoryEntry.Action = (_a = class {
    },
    _a.CREATE = "CREATE",
    _a.UPDATE = "UPDATE",
    _a.DOWNLOAD = "DOWNLOAD",
    _a.RATE = "RATE",
    _a);
