import { S3Client, CreateBucketCommand, HeadBucketCommand, PutObjectCommand, ListBucketsCommand} from '@aws-sdk/client-s3';
import { Logger } from './Logger';

export class S3 {
    static bucketName = 'ece461-f2024-bucket';
    static s3Client = new S3Client({
        credentials: {
            accessKeyId: `${process.env.AWS_ACCESS_KEY_ID}`, // Default access key
            secretAccessKey: `${process.env.AWS_SECRET_ACCESS_KEY}`, // Default secret key
        },
        region: 'us-east-1', // Default region
    });

    static async bucketExists(bucketName=S3.bucketName): Promise<boolean> {
        Logger.logInfo(`Checking if bucket ${bucketName} exists`);
        try {
            const headBucketCommand = new HeadBucketCommand({ Bucket: bucketName });
            await S3.s3Client.send(headBucketCommand);
            return true; // Bucket exists
        } catch (error: any | Error) {
            if (error.statusCode === 404) {
                return false; // Bucket does not exist
            }
            throw error; // Other error
        }
    }

    static async uploadBase64Zip(base64Zip: string, key: string) {
        try {
            const buffer = Buffer.from(base64Zip, 'base64');
            const putObjectCommand = new PutObjectCommand({
                Bucket: S3.bucketName,
                Key: key,
                Body: buffer,
                ContentType: 'application/zip',
            });
            await S3.s3Client.send(putObjectCommand);
            console.log(`Uploaded ${key} to ${S3.bucketName}`);
        } catch (error: any) {
            console.error(`Error uploading ${key} to ${S3.bucketName}:`, error);
        }
    }
}