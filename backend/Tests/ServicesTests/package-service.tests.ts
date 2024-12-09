import express from 'express';
import request from 'supertest';
import { PackageCostService } from '../../src/services/package/PackageCostService';
import { PackageQueryController } from '../../src/controllers/PackageQueryController';
import { Database, PackageDetails } from '../../src/database_pg';
import { PackageMetadata } from '../../src/models/package/PackageMetadata';
import { S3 } from '../../src/utils/S3';
import { before } from 'node:test';
import { PackageService } from '../../src/services/package/PackageService';
import { PackageUploadService } from '../../src/services/package/PackageUploadService';
import { Package } from '../../src/models/package/Package';
import { PackageData } from '../../src/models/package/PackageData';
import { URLHandler } from '../../src/utils/URLHandler';
import { MetricManager } from '../../src/services/metrics/MetricManager';
import { BusFactor } from '../../src/services/metrics/BusFactor';
import { Correctness } from '../../src/services/metrics/Correctness';
import * as dependency from '../../src/services/metrics/Dependency';
import { License } from '../../src/services/metrics/License';
import { Maintainer } from '../../src/services/metrics/Maintainer';
import { PullRequest } from '../../src/services/metrics/PullRequest';
import { RampUp } from '../../src/services/metrics/RampUp';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { json } from 'stream/consumers';

describe('PackageService', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    describe('getPackagesByRegex()', () => {
        it('should return a list of packages that match the regex', async () => {
            const regex = 'cloudinary';
            const packageService = new PackageService();

            const mockReturnData: PackageMetadata[] = [new PackageMetadata('cloudinary', '1.0.0'), new PackageMetadata('cloudinary', '2.0.0')];
            jest.spyOn(Database.prototype, 'getPackagesByRegex').mockResolvedValue(mockReturnData);

            const response = await packageService.getPackagesByRegex(regex);
            expect(response).toBeInstanceOf(Array);
            expect(response.length).toBeGreaterThan(0);
        });

        it('should return an empty list if no packages match the regex', async () => {
            const regex = 'invalidpackage';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'getPackagesByRegex').mockResolvedValue([]);

            const response = await packageService.getPackagesByRegex(regex);
            expect(response).toBeInstanceOf(Array);
            expect(response.length).toBe(0);
        });

        it('should return an error if the database query fails', async () => {
            const regex = 'cloudinary';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'getPackagesByRegex').mockRejectedValue(new Error('Database error'));

            try {
                await packageService.getPackagesByRegex(regex);
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect((error as Error).message).toBe('Failed to fetch packages');
            }
        });

        it('should return an empty list if error with the regex', async () => {
            const regex = 'invalidregex(';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'getPackagesByRegex').mockRejectedValue(new Error('invalid regular expression'));

            const response = await packageService.getPackagesByRegex(regex);
            expect(response).toBeInstanceOf(Array);
            expect(response.length).toBe(0);
        });
    });

    describe("getPackagesByQuery()", () => {
        it('should return a list of packages that match the query', async () => {
            const query = [{Version: '1.0.0', Name: 'cloudinary'}];
            const packageService = new PackageService();

            const mockReturnData: PackageMetadata[] = [new PackageMetadata('cloudinary', '1.0.0'), new PackageMetadata('cloudinary', '2.0.0')];
            jest.spyOn(Database.prototype, 'getAllPackageMetadata').mockResolvedValue(mockReturnData);

            const response = await packageService.getPackagesByQuery(query, 0);
            expect(response).toBeInstanceOf(Array);
            expect(response.length).toBeGreaterThan(0);
        });

        it('should return an empty list if no packages match the query', async () => {
            const query = [{Version: '1.0.0', Name: 'invalidpackage'}];
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'getAllPackageMetadata').mockResolvedValue([]);

            const response = await packageService.getPackagesByQuery(query, 0);
            expect(response).toBeInstanceOf(Array);
            expect(response.length).toBe(0);
        });

        it('should return an error if the database query fails', async () => {
            const query = [{Version: '1.0.0', Name: 'cloudinary'}];
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'getAllPackageMetadata').mockRejectedValue(new Error('Database error'));

            try {
                await packageService.getPackagesByQuery(query, 0);
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect((error as Error).message).toBe('Failed to fetch packages');
            }
        });
    });

    describe('getPackageById()', () => {
        it('should return error if the package does not exist in database', async () => {
            const packageId = 'packageId';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'packageExists').mockResolvedValue(false);

            try {
                await packageService.getPackageById(packageId);
            } catch (error) {
                expect((error as Error).message).toBe('404: Package does not exist');
            }
        });

        it('should return error if the package details cannot be retrieved', async () => {
            const packageId = 'packageId';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'packageExists').mockResolvedValue(true);
            jest.spyOn(Database.prototype, 'getDetails').mockResolvedValue(null);

            try {
                await packageService.getPackageById(packageId);
            } catch (error) {
                expect((error as Error).message).toBe('404: Package does not exist');
            }
        });

        it('should return error if the package file cannot be retrieved', async () => {
            const packageId = 'packageId';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'packageExists').mockResolvedValue(true);
            jest.spyOn(Database.prototype, 'getDetails').mockResolvedValue({name: 'cloudinary', version: '1.0.0', readme: 'test', githubURL: 'https://www.github.com', jsprogram: '', uploadUrl: 'https://www.upload.com'});
            jest.spyOn(S3, 'getFileByKey').mockResolvedValue(null);

            try {
                await packageService.getPackageById(packageId);
            } catch (error) {
                expect((error as Error).message).toBe('404: Package does not exist');
            }
        });

        it('should return the package details if the package exists', async () => {
            const packageId = 'packageId';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'packageExists').mockResolvedValue(true);
            jest.spyOn(Database.prototype, 'getDetails').mockResolvedValue({name: 'cloudinary', version: '1.0.0', readme: 'test', githubURL: 'https://www.github.com', jsprogram: '', uploadUrl: 'https://www.upload.com'});
            jest.spyOn(S3, 'getFileByKey').mockResolvedValue('UEsDBBQAAAAAADZVaVMAAAAAAAAAAAAAAAAFACAAdXVpZC9VVA0AB7iWimG4lophuJaKYXV4CwABBPcBAAAEFAAAAFBLAwQUAAgACAAkVWlTAAAAAAAAAAB6AQAAFgAgAHV1aWQvYmFiZWwuY29uZmlnLmpzb25VVA0AB5SWimGUlophlJaKYXV4CwABBPcBAAAEFAAAAKvmUlBQKihKLU4tKVayUoiO1QEL5JSmZ');

            const packageDetails = await packageService.getPackageById(packageId);
            expect(packageDetails).toHaveProperty('data');
            expect(packageDetails['data']).toHaveProperty('JSProgram');
            expect(packageDetails['data']).toHaveProperty('content');
            expect(packageDetails['data']).toHaveProperty('uploadUrl');
        });
    });

    describe("checkPackageIDExists()", () => {
        it('should return true if the package exists in the database', async () => {
            const packageId = 'packageId';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'packageExists').mockResolvedValue(true);

            const response = await packageService.checkPackageIDExists(packageId);
            expect(response).toBe(true);
        });

        it('should return false if the package does not exist in the database', async () => {
            const packageId = 'packageId';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'packageExists').mockResolvedValue(false);

            const response = await packageService.checkPackageIDExists(packageId);
            expect(response).toBe(false);
        });
    });

    describe("getRating()", () => {
        it('should return an error if package does not exist in the database', async () => {
            const packageId = 'packageId';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'packageExists').mockResolvedValue(false);

            try {
                await packageService.getRating(packageId);
            } catch (error) {
                expect((error as Error).message).toBe('404: Package not found');
            }
        });

        it('should return an error if the package does not have a URL', async () => {
            const packageId = 'packageId';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'packageExists').mockResolvedValue(true);
            jest.spyOn(Database.prototype, 'getPackageURL').mockResolvedValue("");

            try {
                await packageService.getRating(packageId);
            } catch (error) {
                expect((error as Error).message).toBe('Package URL not found in databases');
            }
        });

        it('should return metrics if the package exists and has a URL', async () => {
            jest.setTimeout(30000);  // this is longer-running test because it is calculating all the ratings
            const packageId = 'packageId';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'packageExists').mockResolvedValue(true);
            jest.spyOn(Database.prototype, 'getPackageURL').mockResolvedValue("https://github.com/cloudinary/cloudinary_gem");
            // have to mock dependency getJson as well
            jest.spyOn(dependency, 'getPackageJson').mockResolvedValue({
                "name": "my-package",
                "version": "1.0.0",
                "dependencies": {
                "express": "^4.17.1",
                "lodash": "^4.17.21"
                }
            });
            // have to mock URLHandler.create as well
            jest.spyOn(URLHandler, 'isValidURL').mockReturnValue(true);
            jest.spyOn(URLHandler, 'checkUrlExists').mockResolvedValue(true);


            jest.spyOn(BusFactor.prototype, 'calculateBusFactor').mockResolvedValue(0.5);
            jest.spyOn(Correctness.prototype, 'getCorrectnessScore').mockResolvedValue(0.5);
            jest.spyOn(dependency.DependencyMetric.prototype, 'getPackageScore').mockReturnValue(0.5);
            jest.spyOn(License.prototype, 'getRepoLicense').mockResolvedValue(1); // License is only 1 or 0
            jest.spyOn(Maintainer.prototype, 'getMaintainerScore').mockResolvedValue(0.5);
            jest.spyOn(PullRequest.prototype, 'getPullRequest').mockResolvedValue(0.5);
            jest.spyOn(RampUp.prototype, 'getRampUpScore').mockResolvedValue(0.5);


            const metrics = await packageService.getRating(packageId);
            expect(metrics).toHaveProperty('packageRating');
        });

        it('should return an error if error when calculating metrics', async () => {
            const packageId = 'packageId';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'packageExists').mockResolvedValue(true);
            jest.spyOn(Database.prototype, 'getPackageURL').mockResolvedValue('https://github.com/cloudinary/cloudinary_gem');
            jest.spyOn(URLHandler, 'isValidURL').mockReturnValue(true);
            jest.spyOn(URLHandler, 'checkUrlExists').mockResolvedValue(true);

            jest.spyOn(MetricManager.prototype, 'getMetrics').mockRejectedValue(new Error('Error calculating metrics'));

            try {
                await packageService.getRating(packageId);
            } catch (error) {
                expect((error as Error).message).toBe('Error calculating metrics');
            }
        });
    });

    describe("getCost()", () => {
        it('should return an error if the package does not exist in the database', async () => {
            const packageId = 'packageId';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'packageExists').mockResolvedValue(false);

            try {
                await packageService.getCost(packageId, false);
            } catch (error) {
                expect((error as Error).message).toBe('404: Package not found');
            }
        });

        it('should have totalcost == standalone cost if dependencies is false', async () => {
            const packageId = 'packageId';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'packageExists').mockResolvedValue(true);
            jest.spyOn(PackageCostService.prototype, 'getStandaloneCost').mockResolvedValue(5);

            const cost = await packageService.getCost(packageId, false);
            expect(cost).toHaveProperty('packageId');
            expect(cost['packageId']).toHaveProperty('totalCost');
            expect(cost['packageId']['totalCost']).toBe(5);
        });

        it('should have totalcost > standalone cost if dependencies is true', async () => {
            const packageId = 'packageId';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'packageExists').mockResolvedValue(true);
            jest.spyOn(PackageCostService.prototype, 'getStandaloneCost').mockResolvedValue(5);
            jest.spyOn(PackageCostService.prototype, 'getTotalCost').mockResolvedValue({'packageId': {'totalCost': 10, 'standaloneCost': 5}});

            const cost = await packageService.getCost(packageId, true);
            expect(cost).toHaveProperty('packageId');
            expect(cost['packageId']).toHaveProperty('totalCost');
            expect(cost['packageId']['totalCost']).toBeGreaterThan(5);
        });
    });

    describe("reset()", () => {
        it('should delete all packages from database', async () => {
            jest.spyOn(Database.prototype, 'deleteAllPackages').mockResolvedValue(void 0);
            jest.spyOn(S3, 'deleteAllPackages').mockResolvedValue(void 0);
            jest.spyOn(Database.prototype, 'deleteAllUsers').mockResolvedValue(void 0);

            const packageService = new PackageService();
            await packageService.reset();
        });
    });

    describe("deletePackageByName()", () => {
        it("should return an error if the package does not exist in the database", async () => {
            const packageId = 'packageId';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'packageExistsbyName').mockResolvedValue(false);

            try {
                await packageService.deletePackageByName(packageId);
            } catch (error) {
                expect((error as Error).message).toBe('404: Package does not exist.');
            }
        });

        it("should return an error if package IDs cannot be retrieved", async () => {
            const packageId = 'packageId';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'packageExistsbyName').mockResolvedValue(true);
            jest.spyOn(Database.prototype, 'deletePackagebyName').mockResolvedValue(null);

            try {
                await packageService.deletePackageByName(packageId);
            } catch (error) {
                expect((error as Error).message).toBe('404: Package does not exist.');
            }
        });

        it("should return an error if the package file cannot be deleted", async () => {
            const packageId = 'packageId';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'packageExistsbyName').mockResolvedValue(true);
            jest.spyOn(Database.prototype, 'deletePackagebyName').mockResolvedValue(['packageId']);
            jest.spyOn(S3, 'deletePackagebyID').mockRejectedValue(new Error('Failed to delete package'));

            try {
                await packageService.deletePackageByName(packageId);
            } catch (error) {
                expect((error as Error).message).toBe('Failed to delete package');
            }
        });

        it('should not throw an error if the package is successfully deleted', async () => {
            const packageId = 'packageId';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'packageExistsbyName').mockResolvedValue(true);
            jest.spyOn(Database.prototype, 'deletePackagebyName').mockResolvedValue(['packageId1', 'packageId2']);
            jest.spyOn(S3, 'deletePackagebyID').mockResolvedValue(true);

            await packageService.deletePackageByName(packageId);
        });
    });

    describe("deletePackageById()", () => {
        it("should return an error if the package does not exist in the database", async () => {
            const packageId = 'packageId';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'packageExists').mockResolvedValue(false);

            try {
                await packageService.deletePackageById(packageId);
            } catch (error) {
                expect((error as Error).message).toBe('404: Package does not exist.');
            }
        });

        it("should return an error if package cannot be deleted", async () => {
            const packageId = 'packageId';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'packageExists').mockResolvedValue(true);
            jest.spyOn(Database.prototype, 'deletePackagebyID').mockRejectedValue(new Error('Failed to delete package'));

            try {
                await packageService.deletePackageById(packageId);
            } catch (error) {
                expect((error as Error).message).toBe('Failed to delete package');
            }
        });

        it('should not throw an error if the package is successfully deleted', async () => {
            const packageId = 'packageId';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'packageExists').mockResolvedValue(true);
            jest.spyOn(Database.prototype, 'deletePackagebyID').mockResolvedValue(void 0);
            jest.spyOn(S3, 'deletePackagebyID').mockResolvedValue(true);

            await packageService.deletePackageById(packageId);
        });
    });

    describe("createAccessToken()", () => {
        jest.mock('bcryptjs', () => ({
            ...jest.requireActual('bcryptjs'),   // Use actual bcryptjs for all methods except compare
            compare: jest.fn(),  // Mock bcrypt.compare
          }));
        jest.mock('jsonwebtoken', () => ({
            ...jest.requireActual('jsonwebtoken'),   // Use actual jsonwebtoken for all methods except sign
            sign: jest.fn(),  // Mock jwt.sign
          }));

        it("should return an error if the user does not exist in the database", async () => {
            const username = 'username';
            const password = 'password';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'userExists').mockResolvedValue(false);

            try {
                await packageService.createAccessToken(username, password, false);
            } catch (error) {
                expect((error as Error).message).toBe('401: The user does not exist');
            }
        });

        it("should return an error if the password DNE", async () => {
            const username = 'username';
            const password = 'password';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'userExists').mockResolvedValue(true);
            jest.spyOn(Database.prototype, 'getPW').mockResolvedValue(null);

            try {
                await packageService.createAccessToken(username, password, false);
            } catch (error) {
                expect((error as Error).message).toBe('401: The password DNE in database');
            }
        });

        it("should return an error if the password is incorrect", async () => {
            const username = 'username';
            const password = 'password';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'userExists').mockResolvedValue(true);
            jest.spyOn(Database.prototype, 'getPW').mockResolvedValue('password1');
            bcrypt.compare = jest.fn().mockResolvedValue(false);
            try {
                await packageService.createAccessToken(username, password, false);
            } catch (error) {
                expect((error as Error).message).toBe('401: The password is incorrect');
            }
        });

        it("should return an error if the admin status is incorrect", async () => {
            const username = 'username';
            const password = 'password';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'userExists').mockResolvedValue(true);
            jest.spyOn(Database.prototype, 'getPW').mockResolvedValue('password');
            bcrypt.compare = jest.fn().mockResolvedValue(true);
            jest.spyOn(Database.prototype, 'isAdmin').mockResolvedValue(true);

            try {
                await packageService.createAccessToken(username, password, false);
            } catch (error) {
                expect((error as Error).message).toBe('401: Wrong permissions provided');
            }
        });

        it("should return an error if the JWT_KEY is not set", async () => {
            const originalJwtKey = process.env.JWT_KEY;
            delete process.env.JWT_KEY;

            const username = 'username';
            const password = 'password';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'userExists').mockResolvedValue(true);
            jest.spyOn(Database.prototype, 'getPW').mockResolvedValue('password');
            bcrypt.compare = jest.fn().mockResolvedValue(true);
            jest.spyOn(Database.prototype, 'isAdmin').mockResolvedValue(false);

            try {
                await packageService.createAccessToken(username, password, false);
            } catch (error) {
                expect((error as Error).message).toBe('501: JWT_KEY undefined. Check your environment variables.');
            }

            process.env.JWT_KEY = originalJwtKey;
        });

        it("should return a token if the user exists and the password is correct", async () => {
            const username = 'username';
            const password = 'password';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'userExists').mockResolvedValue(true);
            jest.spyOn(Database.prototype, 'getPW').mockResolvedValue('password');
            bcrypt.compare = jest.fn().mockResolvedValue(true);
            jest.spyOn(Database.prototype, 'isAdmin').mockResolvedValue(false);

            const token = await packageService.createAccessToken(username, password, false);
            expect(token).toContain('bearer');
        });

        it("should return an error if the token signing fails", async () => {
            const username = 'username';
            const password = 'password';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'userExists').mockResolvedValue(true);
            jest.spyOn(Database.prototype, 'getPW').mockResolvedValue('password');
            bcrypt.compare = jest.fn().mockResolvedValue(true);
            jest.spyOn(Database.prototype, 'isAdmin').mockResolvedValue(false);
            jwt.sign = jest.fn().mockReturnValue(null);

            try {
                await packageService.createAccessToken(username, password, false);
            } catch (error) {
                expect((error as Error).message).toBe("501: Error creating token.");
            }
        });

        it("should throw an error if unhandled error occurs", async () => {
            const username = 'username';
            const password = 'password';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'userExists').mockRejectedValue(new Error('Failed to create token'));

            try {
                await packageService.createAccessToken(username, password, false);
            } catch (error) {
                expect((error as Error).message).toBe('Failed to create token');
            }
        });
    });

    describe("registerUser()", () => {
        it("should return an error if the user already exists in the database", async () => {
            const username = 'username';
            const password = 'password';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'userExists').mockResolvedValue(true);

            try {
                await packageService.registerUser(username, false, password);
            } catch (error) {
                expect((error as Error).message).toBe("409: Please choose a unique username");
            }
        });

        it("should throw an error if the user cannot be added to the database", async () => {
            const username = 'username';
            const password = 'password';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'userExists').mockResolvedValue(false);
            jest.spyOn(Database.prototype, 'addUser').mockRejectedValue(new Error('Failed to add user'));

            try {
                await packageService.registerUser(username, false, password);
            } catch (error) {
                expect((error as Error).message).toBe('Failed to add user');
            }
        });

        it("should not throw an error if the user deletion is successful", async () => {
            const username = 'username';
            const password = 'password';
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'userExists').mockResolvedValue(false);
            jest.spyOn(Database.prototype, 'addUser').mockResolvedValue(void 0);

            await packageService.registerUser(username, false, password);
        });
    });

    describe("addDefaultUser()", () => {
        it("shold return an error if the default user already exists in the database", async () => {
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'userExists').mockResolvedValue(true);

            try {
                await packageService.addDefaultUser();
            } catch (error) {
                expect((error as Error).message).toBe("409: Default user already exists");
            }
        });

        it("should return an error if the default user cannot be added to the database", async () => {
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'userExists').mockResolvedValue(false);
            jest.spyOn(Database.prototype, 'addUser').mockRejectedValue(new Error('Failed to add user'));

            try {
                await packageService.addDefaultUser();
            } catch (error) {
                expect((error as Error).message).toBe('Failed to add user');
            }
        });

        it("should not throw an error if the default user is successfully added", async () => {
            const packageService = new PackageService();

            jest.spyOn(Database.prototype, 'userExists').mockResolvedValue(false);
            jest.spyOn(Database.prototype, 'addUser').mockResolvedValue(void 0);

            await packageService.addDefaultUser();
        });
    });

    describe("dummyToken()", () => {
        it("should return a dummy token", async () => {
            const packageService = new PackageService();
            const token = packageService.dummyToken();
        });

        it("should return an error if the token signing fails", async () => {
            const packageService = new PackageService();

            jwt.sign = jest.fn().mockReturnValue(null);

            try {
                packageService.dummyToken();
            } catch (error) {
                expect((error as Error).message).toBe("501: Error creating token.");
            }
        });
    });
});