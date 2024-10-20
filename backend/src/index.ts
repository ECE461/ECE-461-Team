import express from 'express';
import { PackageEndpoints } from './endpoints/PackageEndpoints';
import dotenv from 'dotenv';
import { Logger } from './utils/Logger';

const cors = require('cors');
const app = express();
const port = process.env.PORT || 3005;

(async () => {
    try {
        dotenv.config();
        
        const baseURL = '/api/v1';
        app.use(cors());
        app.use(express.json());
        
        const packageEndpoints = new PackageEndpoints();
        app.use(baseURL, packageEndpoints.getRouter());
        
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}${baseURL}`);
        });
    } catch (error) {
        console.error('Error starting the application:', error);
    }
})();