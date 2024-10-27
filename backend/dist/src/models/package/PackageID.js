"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageID = void 0;
const crypto_1 = __importDefault(require("crypto"));
class PackageID {
    constructor(packageName, packageVersion) {
        // Create unique identifier number from combination of package name and version
        const data = packageName + packageVersion;
        this.id = crypto_1.default.createHash('sha256').update(data).digest('hex');
    }
    static isValidGetByIdRequest(req) {
        // TODO: Add logic
        //the only endpoints that have an id are /packages/{id} endpoints, so don't need to consider the possibility that it's in a formatted req body
        if (req.params.id) {
            return true;
        }
        return false;
    }
    getId() {
        return this.id;
    }
}
exports.PackageID = PackageID;
