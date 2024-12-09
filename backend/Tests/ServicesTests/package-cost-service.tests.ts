import express from 'express';
import request from 'supertest';
import { PackageCostService } from '../../src/services/package/PackageCostService';
import { PackageQueryController } from '../../src/controllers/PackageQueryController';
import { Database } from '../../src/database_pg';
import { S3 } from '../../src/utils/S3';
import { before } from 'node:test';



describe('PackageCostService', () => {

    describe('getStandaloneCost()', () => {

        it('should throw a 404 error if the package does not exist in database', async () => {
            const packageId = 'invalidpackage';
            const packageCostService = new PackageCostService();

            jest.spyOn(Database.prototype, 'packageExists').mockResolvedValue(false);

            try {
                await packageCostService.getStandaloneCost(packageId);
            } catch (error) {
                expect((error as Error).message).toBe('404: Package not found');
            }
        });

        it('should throw a 404 error if the package does not exist in S3', async () => {
            const packageId = 'invalidpackage';
            const packageCostService = new PackageCostService();

            jest.spyOn(Database.prototype, 'packageExists').mockResolvedValue(true);
            jest.spyOn(S3, 'checkIfPackageExists').mockResolvedValue(false);

            try {
                await packageCostService.getStandaloneCost(packageId);
            } catch (error) {
                expect((error as Error).message).toBe('404: Package not found');
            }
        });

        it('should throw a 404 error if the package does not exist in S3', async () => {
            const packageId = 'invalidpackage';
            const packageCostService = new PackageCostService();

            jest.spyOn(Database.prototype, 'packageExists').mockResolvedValue(true);
            jest.spyOn(S3, 'checkIfPackageExists').mockResolvedValue(true);
            jest.spyOn(S3, 'getFileByKey').mockResolvedValue(null);

            try {
                await packageCostService.getStandaloneCost(packageId);
            } catch (error) {
                expect((error as Error).message).toBe('404: Package not found');
            }
        });

        it('should return the standalone cost of a valid package', async () => {
            const packageId = 'validpackage';
            const packageCostService = new PackageCostService();

            jest.spyOn(Database.prototype, 'packageExists').mockResolvedValue(true);
            jest.spyOn(S3, 'checkIfPackageExists').mockResolvedValue(true);
            jest.spyOn(S3, 'getFileByKey').mockResolvedValue('test');

            const standaloneCost = await packageCostService.getStandaloneCost(packageId);
            expect(standaloneCost).toBe(3);
        });
    });

    describe('getTotalCost()', () => {

        it("should return the total cost of a package's dependencies", async () => {
            const packageId = 'validpackage';
            const packageCostService = new PackageCostService();

            jest.spyOn(Database.prototype, 'packageExists').mockResolvedValue(true);
            jest.spyOn(Database.prototype, 'getPackageVersionsByName').mockResolvedValue([]);
            jest.spyOn(S3, 'checkIfPackageExists').mockResolvedValue(true);
            jest.spyOn(S3, 'getFileByKey').mockResolvedValue('test');
            jest.spyOn(PackageCostService.prototype, 'getDependencies').mockResolvedValue(['dependency1', 'dependency2']);

            const returnDict = {};
            const totalCost = await packageCostService.getTotalCost(packageId);
            expect(totalCost).toHaveProperty(packageId);
        });
    });

    describe('findCompatibleVersion()', () => {

        it('should return "" if no packages found', async () => {
            const packageId = 'invalidpackage';
            const packageCostService = new PackageCostService() as any;

            jest.spyOn(Database.prototype, 'getPackageVersionsByName').mockResolvedValue([]);

            const compatibleVersion = await packageCostService.findCompatibleVersion(packageId);
            expect(compatibleVersion).toBe('');
        });

        it('should return "" if no compatible versions found', async () => {
            const packageId = 'packageId';
            const packageCostService = new PackageCostService() as any;

            jest.spyOn(Database.prototype, 'getPackageVersionsByName').mockResolvedValue([{ id: 'packageId2', version: '1.0.0' }]);

            const compatibleVersion = await packageCostService.findCompatibleVersion(packageId, '2.0.0');
            expect(compatibleVersion).toBe('');
        });

        it('should return the compatible version if found', async () => {
            const packageId = 'packageId';
            const packageCostService = new PackageCostService() as any;

            jest.spyOn(Database.prototype, 'getPackageVersionsByName').mockResolvedValue([{ id: 'packageId', version: '1.0.0' }]);

            const compatibleVersion = await packageCostService.findCompatibleVersion(packageId, '1.0.0');
            expect(compatibleVersion).toBe('packageId');
        });

        it('should return the newest compatible version if multiple found', async () => {
            const packageId = 'packageId';
            const packageCostService = new PackageCostService() as any;

            jest.spyOn(Database.prototype, 'getPackageVersionsByName').mockResolvedValue([
                { id: 'packageId', version: '1.0.0' },
                { id: 'packageId2', version: '2.0.0' }
            ]);

            const compatibleVersion = await packageCostService.findCompatibleVersion(packageId, '>=1.0.0');
            expect(compatibleVersion).toBe('packageId2');
        });
    });

    describe('getDependencies()', () => {

        beforeEach(() => {
            jest.resetAllMocks();
            jest.clearAllMocks();
        });

        it('should throw a 404 error if the package does not exist in database', async () => {

            const packageId = 'invalidpackage';
            const packageCostService = new PackageCostService();

            jest.spyOn(Database.prototype, 'packageExists').mockResolvedValue(false);

            try {
                await packageCostService.getDependencies(packageId);
            } catch (error) {
                expect((error as Error).message).toBe('404: Package not found');
            }
        });

        it('should throw a 404 error if the package does not exist in S3', async () => {
            const packageId = 'invalidpackage';
            const packageCostService = new PackageCostService();

            jest.spyOn(Database.prototype, 'packageExists').mockResolvedValue(true);
            jest.spyOn(S3, 'checkIfPackageExists').mockResolvedValue(false);

            try {
                await packageCostService.getDependencies(packageId);
            } catch (error) {
                expect((error as Error).message).toBe('404: Package not found');
            }
        });
    });

});