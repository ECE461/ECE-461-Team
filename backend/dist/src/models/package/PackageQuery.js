"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageQuery = void 0;
const PackageName_1 = require("./PackageName");
const PackageVersionQuery_1 = require("./PackageVersionQuery");
const PackageVersion_1 = require("./PackageVersion");
const joi_1 = __importDefault(require("joi"));
class PackageQuery {
    constructor(name, versionQuery) {
        this.name = new PackageName_1.PackageName(name);
        this.versionQuery = new PackageVersionQuery_1.PackageVersionQuery(versionQuery);
    }
    static isValidQuery(req) {
        // Request body validation
        const { error } = PackageQuery.packageQuerySchema.validate(req.body);
        if (error) {
            return false;
        }
        // Offset validation
        const offset = req.query.offset ? Number(req.query.offset) : 0;
        if (isNaN(offset) || offset < 0 || !Number.isInteger(offset)) {
            return false;
        }
        return true;
    }
    isValid() {
        return PackageName_1.PackageName.isValidName(this.name.getName()) && PackageVersion_1.PackageVersion.isValidVersion(this.versionQuery.getVersionQuery());
    }
    checkMatches(packetMetadata) {
        if (this.name.getName() === "*") {
            return true;
        }
        return this.name.matches(packetMetadata.getName()) && this.versionQuery.matches(packetMetadata.getVersion());
    }
    getJson() {
        return {
            Version: this.versionQuery.getVersionQuery(),
            Name: this.name.getName()
        };
    }
}
exports.PackageQuery = PackageQuery;
PackageQuery.packageQuerySchema = joi_1.default.array().items(joi_1.default.object({
    Name: joi_1.default.string().
        required()
        .custom((value, helpers) => {
        value = value.replace(/\s/g, '');
        if (!PackageName_1.PackageName.isValidName(value)) {
            return helpers.error('any.invalid');
        }
        return value;
    }),
    Version: joi_1.default.string()
        .required()
        .custom((value, helpers) => {
        value = value.replace(/\s/g, '');
        if (!PackageVersionQuery_1.PackageVersionQuery.isValidVersionQuery(value)) {
            return helpers.error('any.invalid');
        }
        return value;
    }),
})).required();
