import express from 'express';
import { PackageEndpoints } from './endpoints/PackageEndpoints';
import { Logger } from './utils/Logger';
import { exec } from 'child_process';
import path from 'path';

const cors = require('cors');
const next = require('next');

// Check that all required env variables have been set:
if (!process.env.RDS_USER || !process.env.RDS_KEY || !process.env.RDS_HOST || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.GITHUB_TOKEN || !process.env.SSH_KEY_PATH_ || !process.env.JWT_KEY) {
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
        8. JWT_KEY (Required): xxxx bit number required to authenticate 

        Optional:
        9. NODE_ENV: set to 'FAKE_SUCCESS' to use fake data
        10. LOG_LEVEL: 2 for debug, 1 for info, 0 for silent
        11. LOG_FILE: path to log file (default is default.log)
        12. PORT: port for the server to run on (default is 3000)
        13. LOG_CONSOLE: set to 'debug' or 'info' to log to console as well as file
    `);
    process.exit(1);
} else {
    (async () => {
        try {
            const app = express();
            const apiURL = '/api';
            app.use(cors());
            app.use(express.json({limit: '10mb'}));
            
            // API Routes:
            const packageEndpoints = new PackageEndpoints();
            app.use(apiURL, packageEndpoints.getRouter());

            const nextApp = next({ dev: false, dir: path.join(__dirname, '../../frontend') });
            const handle = nextApp.getRequestHandler();
            await nextApp.prepare();
            app.all('*', (req, res) => handle(req, res));
            
            // Set HOST to 0.0.0.0 in EC2
            const host = process.env.HOST ? process.env.HOST : 'localhost';
            const port = process.env.PORT ? Number(process.env.PORT) : 3000;
            app.listen(port, host, () => {
                console.log(`Backend server running at http://localhost:${port}${apiURL}`);
                console.log(`Frontend server running at http://localhost:${port}`);
                Logger.logInfo(`Backend server running at http://localhost:${port}${apiURL}`);
                Logger.logInfo(`Frontend server running at http://localhost:${port}`);
            });
        } catch (error) {
            console.error('Error starting the application:', error);
            Logger.logError('Error starting the application:', error);
        }
    })();
}