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
const express_1 = __importDefault(require("express"));
const PackageEndpoints_1 = require("./endpoints/PackageEndpoints");
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

        Optional:
        7. NODE_ENV: set to 'FAKE_SUCCESS' to use fake data
        8. LOG_LEVEL: 2 for debug, 1 for info, 0 for silent
        9. LOG_FILE: path to log file (default is default.log)
        10. PORT: port for the server to run on (default is 3000)
    `);
    process.exit(1);
}
else {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const app = (0, express_1.default)();
            const port = process.env.PORT || 3000;
            const baseURL = '/api/v1';
            app.use(cors());
            app.use(express_1.default.json());
            const packageEndpoints = new PackageEndpoints_1.PackageEndpoints();
            app.use(baseURL, packageEndpoints.getRouter());
            app.listen(port, () => {
                console.log(`Server running at http://localhost:${port}${baseURL}`);
            });
        }
        catch (error) {
            console.error('Error starting the application:', error);
        }
    }))();
}
