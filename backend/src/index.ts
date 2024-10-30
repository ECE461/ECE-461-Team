import express from 'express';
import { PackageEndpoints } from './endpoints/PackageEndpoints';
import { Logger } from './utils/Logger';

const cors = require('cors');

// Check that all required env variables have been set:
if (!process.env.RDS_USER || !process.env.RDS_KEY || !process.env.RDS_HOST || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.GITHUB_TOKEN) {
    console.error(`Missing required environment variables. 
    Please set the following environment variables:
        Required:
        1. RDS_USER (Required): The username for the RDS database
        2. RDS_KEY (Required): The password for the RDS database
        3. RDS_HOST (Required): The host for the RDS database (e.g. localhost for local development)
        4. AWS_ACCESS_KEY_ID (Required): IAM user access key ID for S3 permissions
        5. AWS_SECRET_ACCESS_KEY (Required): IAM user secret access key for S3 permissions
        6. GITHUB_TOKEN (Required): GitHub personal access token
        7. SSH_KEY_PATH_ (Required): Absolute file path to the ssh key that is used to connect to RDS in tunnel.sh

        Optional:
        8. NODE_ENV: set to 'FAKE_SUCCESS' to use fake data
        9. LOG_LEVEL: 2 for debug, 1 for info, 0 for silent
        10. LOG_FILE: path to log file (default is default.log)
        11. PORT: port for the server to run on (default is 3000)
    `);
    process.exit(1);
} else {
    (async () => {
        try {
            const app = express();
            const port = process.env.PORT || 3000;
            const baseURL = '/api/v1';
            app.use(cors());
            app.use(express.json({limit: '10mb'}));
            
            
            const packageEndpoints = new PackageEndpoints();
            app.use(baseURL, packageEndpoints.getRouter());
            
            app.listen(port, () => {
                console.log(`Server running at http://localhost:${port}${baseURL}`);
            });
        } catch (error) {
            console.error('Error starting the application:', error);
        }
    })();
}