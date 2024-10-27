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
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3 = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const Logger_1 = require("./Logger");
/**
 * @class S3: Interacts with AWS S3 bucket
 * @method uploadBase64Zip: Uploads base64 encoded zip file to S3 bucket
 * @method deleteAllPackages: Deletes all objects from S3 bucket
 */
class S3 {
    /**
     * @method uploadBase64Zip: Uploads base64 encoded zip file to S3 bucket
     * @param base64Zip : string
     * @param key : string - id of package (see PackageID.ts)
     */
    static uploadBase64Zip(base64Zip, key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Buffer needed for S3 upload
                const buffer = Buffer.from(base64Zip, 'base64');
                // Create command to put object in S3 bucket
                const putObjectCommand = new client_s3_1.PutObjectCommand({
                    Bucket: S3.bucketName,
                    Key: key,
                    Body: buffer,
                    ContentType: 'application/zip',
                });
                // Send command to S3
                yield S3.s3Client.send(putObjectCommand);
                Logger_1.Logger.logInfo(`Uploaded ${key} to ${S3.bucketName}`);
            }
            catch (error) {
                console.error(`Error uploading ${key} to ${S3.bucketName}:`, error);
            }
        });
    }
    /**
     * @method deleteAllPackages: Deletes all objects from S3 bucket
     */
    static deleteAllPackages() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // List objects in the bucket
                const listObjectsCommand = new client_s3_1.ListObjectsV2Command({ Bucket: S3.bucketName });
                const response = yield S3.s3Client.send(listObjectsCommand);
                if (response.Contents && response.Contents.length > 0) {
                    const objectsToDelete = response.Contents.map(obj => ({ Key: obj.Key }));
                    // Command to delete the objects
                    const deleteObjectsCommand = new client_s3_1.DeleteObjectsCommand({
                        Bucket: S3.bucketName,
                        Delete: {
                            Objects: objectsToDelete,
                            Quiet: false,
                        },
                    });
                    // Send command to S3
                    yield S3.s3Client.send(deleteObjectsCommand);
                    Logger_1.Logger.logInfo(`Deleted ${objectsToDelete.length} objects from ${S3.bucketName}`);
                }
                else {
                    Logger_1.Logger.logInfo('No objects found to delete.');
                }
            }
            catch (error) {
                Logger_1.Logger.logInfo('Error deleting objects from S3');
                Logger_1.Logger.logDebug(error);
                throw error;
            }
        });
    }
    static checkIfPackageExists(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Create a HeadObjectCommand to check for the object in the bucket
                const headObjectCommand = new client_s3_1.HeadObjectCommand({
                    Bucket: S3.bucketName,
                    Key: key,
                });
                // Send the command and check if it exists
                yield S3.s3Client.send(headObjectCommand);
                Logger_1.Logger.logInfo(`Package ${key} exists in ${S3.bucketName}`);
                return true; // Package exists
            }
            catch (error) {
                // If the error is "Not Found", return false; otherwise, throw the error
                if (error.name === 'NotFound') {
                    Logger_1.Logger.logInfo(`Package ${key} does not exist in ${S3.bucketName}`);
                    return false;
                }
                Logger_1.Logger.logInfo('Error checking if package exists in S3');
                Logger_1.Logger.logDebug(error);
                throw error;
            }
        });
    }
}
exports.S3 = S3;
S3.bucketName = 'ece461-f2024-bucket';
// Create S3 client for adding and deleting objects
S3.s3Client = new client_s3_1.S3Client({
    credentials: {
        accessKeyId: `${process.env.AWS_ACCESS_KEY_ID}`,
        secretAccessKey: `${process.env.AWS_SECRET_ACCESS_KEY}`, // Default secret key
    },
    region: 'us-east-2', // Default region
});
