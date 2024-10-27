"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageUploadService = void 0;
const adm_zip_1 = __importDefault(require("adm-zip"));
const PackageMetadata_1 = require("../../models/package/PackageMetadata");
class PackageUploadService {
    uploadPackage() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    static extractPackageInfo(packageData) {
        const zipBuffer = Buffer.from(packageData.getContent(), 'base64');
        const zip = new adm_zip_1.default(zipBuffer);
        let packageMetadata = null;
        let readmeContent = '';
        zip.getEntries().forEach((entry) => {
            var _a;
            const fileName = entry.entryName;
            console.log(fileName);
            if (fileName.endsWith('package.json')) {
                const packageJsonContent = entry.getData().toString('utf8');
                const packageInfo = JSON.parse(packageJsonContent);
                packageMetadata = new PackageMetadata_1.PackageMetadata(packageInfo.name, packageInfo.version);
                packageMetadata.setUrl((_a = packageInfo.repository) === null || _a === void 0 ? void 0 : _a.url);
            }
            // TODO: What to do if no readme is found?
            if (fileName.toLowerCase().endsWith('readme.md')) {
                readmeContent = entry.getData().toString('utf8');
            }
        });
        if (packageMetadata === null) {
            throw new Error('400: No package.json found in the uploaded package');
        }
        if (packageMetadata && readmeContent) {
            packageMetadata.setReadMe(readmeContent);
        }
        return packageMetadata;
    }
    static uploadToS3(packageData, packageId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const buffer = Buffer.from(packageData.getContent(), 'base64');
            }
            catch (error) {
                console.error('Error uploading package to S3:', error);
            }
        });
    }
}
exports.PackageUploadService = PackageUploadService;
