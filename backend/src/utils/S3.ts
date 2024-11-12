import { S3Client, HeadBucketCommand, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand} from '@aws-sdk/client-s3';
import { Logger } from './Logger';

/** 
 * @class S3: Interacts with AWS S3 bucket
 * @method uploadBase64Zip: Uploads base64 encoded zip file to S3 bucket
 * @method deleteAllPackages: Deletes all objects from S3 bucket
 */
export class S3 {
    static bucketName = 'ece461-f2024-bucket';

    // Create S3 client for adding and deleting objects
    static s3Client = new S3Client({
        credentials: {
            accessKeyId: `${process.env.AWS_ACCESS_KEY_ID}`, // Default access key
            secretAccessKey: `${process.env.AWS_SECRET_ACCESS_KEY}`, // Default secret key
        },
        region: 'us-east-2', // Default region
    });
    
    /** 
     * @method uploadBase64Zip: Uploads base64 encoded zip file to S3 bucket
     * @param base64Zip : string
     * @param key : string - id of package (see PackageID.ts)
     */
    static async uploadBase64Zip(base64Zip: string, key: string) {
        try {

            // Buffer needed for S3 upload
            const buffer = Buffer.from(base64Zip, 'base64');

            // Create command to put object in S3 bucket
            const putObjectCommand = new PutObjectCommand({
                Bucket: S3.bucketName,
                Key: key,
                Body: buffer,
                ContentType: 'application/zip',
            });

            // Send command to S3
            await S3.s3Client.send(putObjectCommand);
            Logger.logInfo(`Uploaded ${key} to ${S3.bucketName}`);
        } catch (error: any) {
            console.error(`Error uploading ${key} to ${S3.bucketName}:`, error);
        }
    }

    /** 
     * @method deleteAllPackages: Deletes all objects from S3 bucket
     */
    static async deleteAllPackages(): Promise<void> {
        try {
            // List objects in the bucket
            const listObjectsCommand = new ListObjectsV2Command({ Bucket: S3.bucketName });
            const response = await S3.s3Client.send(listObjectsCommand);

            if (response.Contents && response.Contents.length > 0) {
                const objectsToDelete = response.Contents.map(obj => ({ Key: obj.Key }));
                
                // Command to delete the objects
                const deleteObjectsCommand = new DeleteObjectsCommand({
                    Bucket: S3.bucketName,
                    Delete: {
                        Objects: objectsToDelete,
                        Quiet: false,
                    },
                });

                // Send command to S3
                await S3.s3Client.send(deleteObjectsCommand);
                Logger.logInfo(`Deleted ${objectsToDelete.length} objects from ${S3.bucketName}`);
            } else {
                Logger.logInfo('No objects found to delete.');
            }
        } catch (error: any) {
            Logger.logInfo('Error deleting objects from S3');
            Logger.logDebug(error);
            throw error;
        }
    }

    static async checkIfPackageExists(key: string): Promise<boolean> {
        try {
            // Create a HeadObjectCommand to check for the object in the bucket
            const headObjectCommand = new HeadObjectCommand({
                Bucket: S3.bucketName,
                Key: key,
            });

            // Send the command and check if it exists
            await S3.s3Client.send(headObjectCommand);
            Logger.logInfo(`Package ${key} exists in ${S3.bucketName}`);
            return true;  // Package exists
        } catch (error: any) {
            // If the error is "Not Found", return false; otherwise, throw the error
            if (error.name === 'NotFound') {
                Logger.logInfo(`Package ${key} does not exist in ${S3.bucketName}`);
                return false;
            }
            Logger.logInfo('Error checking if package exists in S3');
            Logger.logDebug(error);
            throw error;
        }
    }

    /**
     * @method getFileByKey: Retrieves a file from S3 bucket by its key
     * @param key : string - the key of the file to retrieve
     * @returns {string | null} - the file content as a buffer -> string or null if dne 
     */
    static async getFileByKey(key: string) {
        try {
            // Create command to get object from S3 bucket
            const getObjectCommand = new GetObjectCommand({
                Bucket: S3.bucketName,
                Key: key,
            });

            // Send command to S3
            const response = await S3.s3Client.send(getObjectCommand);

            // Read the response body as a buffer
            const chunks: any[] = [];
            for await (const chunk of response.Body as any) {
                chunks.push(chunk);
            }

            // Combine the chunks into a single buffer
            const buffer = Buffer.concat(chunks);

            Logger.logInfo(`Retrieved ${key} from ${S3.bucketName}`);
            return buffer.toString('base64');

        } catch (error: any) {
            Logger.logInfo(`Error retrieving ${key} from ${S3.bucketName}`);
            Logger.logDebug(error);
            return null; // Handle error (return null if file not found or another error)
        }
    }

        /**
     * @method deletePackage: Deletes a specific package from S3 bucket by its key 
     * */
        static async deletePackagebyID(key: string): Promise<boolean> {
            try {
                // Check if the package exists first
                const exists = await S3.checkIfPackageExists(key);
                if (!exists) {
                    Logger.logInfo(`Package ${key} not found in ${S3.bucketName}, so nothing to delete.`);
                    return false;
                }
    
                // Create a command to delete the specific object
                const deleteObjectCommand = new DeleteObjectCommand({
                    Bucket: S3.bucketName,
                    Key: key
                });
    
                // Send the delete command
                await S3.s3Client.send(deleteObjectCommand);
                Logger.logInfo(`Deleted package ${key} from ${S3.bucketName}`);
                return true;
    
            } catch (error: any) {
                Logger.logInfo(`Error deleting package ${key} from ${S3.bucketName}`);
                Logger.logDebug(error);
                throw error;
            }
        }
        
}