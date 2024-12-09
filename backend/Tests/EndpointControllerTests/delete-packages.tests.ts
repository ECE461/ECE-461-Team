import express from 'express';
import request from 'supertest';
import { PackageEndpoints } from '../../src/endpoints/PackageEndpoints';
import { PackageQueryController } from '../../src/controllers/PackageQueryController';
import { AuthenticationRequest } from '../../src/models/authentication/AuthenticationRequest';
import { PackageService } from '../../src/services/package/PackageService';
import { PackageID } from '../../src/models/package/PackageID';
import { PackageName } from '../../src/models/package/PackageName';

jest.mock('../../src/models/authentication/AuthenticationRequest', () => {
    return {
        AuthenticationRequest: jest.fn().mockImplementation(() => {
            return {
                validateToken: jest.fn().mockResolvedValue(true),
                isAdmin: jest.fn().mockReturnValue(true)
            };
        })
    };
});

describe('DELETE endpoint testing', () => {
    let app: express.Application;

    beforeAll(() => {
        app = express();
        app.use(express.json());

        const packageEndpoints = new PackageEndpoints();
        app.use('/api/v1', packageEndpoints.getRouter());
    });

    describe('DELETE /reset Test Endpoint and Controller', () => {
        it("should return 200 and a success message if user is an admin", async () => {
            jest.spyOn(PackageService.prototype, 'reset').mockResolvedValue(void 0);

            const response = await request(app)
                .delete('/api/v1/reset')
                .set('X-Authorization', 'bearer fake_token')
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(200);

            expect(response.body).toEqual({ "description": "Registry is reset." });
        });

        it("should return 400 if bad request", async () => {
            jest.spyOn(PackageService.prototype, 'reset').mockRejectedValue(new Error("400: Bad Request"));

            const response = await request(app)
                .delete('/api/v1/reset')
                .set('X-Authorization', 'bearer fake_token')
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(400);

            expect(response.body).toEqual({ "description": "There is missing field(s) in the PackageID or it is formed improperly, or is invalid." });
        });

        it("should return 500 if internal server error", async () => {
            jest.spyOn(PackageService.prototype, 'reset').mockRejectedValue(new Error("500: Internal Server Error"));

            const response = await request(app)
                .delete('/api/v1/reset')
                .set('X-Authorization', 'bearer fake_token')
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(500);

            expect(response.body).toEqual({ "description": "Internal Server Error" });
        });
    });

    describe('DELETE /package/:packageID Test Endpoint and Controller', () => {
        it("should return 400 when bad request", async () => {
            jest.spyOn(PackageID, 'isValidGetByIdRequest').mockReturnValue(false);

            const response = await request(app)
                .delete('/api/v1/package/testpackage')
                .set('X-Authorization', 'bearer fake_token')
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(400);

            expect(response.body).toEqual({ "description": "There is missing field(s) in the PackageID or it is formed improperly, or is invalid." });
        });

        it("should return 404 when the package does not exist", async () => {
            jest.spyOn(PackageID, 'isValidGetByIdRequest').mockReturnValue(true);
            jest.spyOn(PackageService.prototype, 'deletePackageById').mockRejectedValue(new Error("404: Not Found"));

            const response = await request(app)
                .delete('/api/v1/package/testpackage')
                .set('X-Authorization', 'bearer fake_token')
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(404);

            expect(response.body).toEqual({ "description": "Package does not exist." });
        });

        it("should return 500 when internal server error", async () => {
            jest.spyOn(PackageID, 'isValidGetByIdRequest').mockReturnValue(true);
            jest.spyOn(PackageService.prototype, 'deletePackageById').mockRejectedValue(new Error("500: Internal Server Error"));

            const response = await request(app)
                .delete('/api/v1/package/testpackage')
                .set('X-Authorization', 'bearer fake_token')
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(500);

            expect(response.body).toEqual({ "description": "Internal Server Error" });
        });

        it("should return 200 when successful", async () => {
            jest.spyOn(PackageID, 'isValidGetByIdRequest').mockReturnValue(true);
            jest.spyOn(PackageService.prototype, 'deletePackageById').mockResolvedValue(void 0);

            const response = await request(app)
                .delete('/api/v1/package/testpackage')
                .set('X-Authorization', 'bearer fake_token')
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(200);

            expect(response.body).toEqual({ "description": "Successfully deleted package via ID." });
        });
    });

    describe("DELETE /package/byName/{id} endpoint tests", () => {
        it("should return 400 if bad request", async () => {
            jest.spyOn(PackageName, 'isValidGetByNameRequest').mockReturnValue(false);

            const response = await request(app)
                .delete('/api/v1/package/byName/testpackage')
                .set('X-Authorization', 'bearer fake_token')
                .expect(400);

            expect(response.body.description).toEqual("There is missing field(s) in the PackageName or it is formed improperly, or is invalid.");
        });

        it("should return 404 if the package does not exist", async () => {
            jest.spyOn(PackageName, 'isValidGetByNameRequest').mockReturnValue(true);
            jest.spyOn(PackageService.prototype, 'deletePackageByName').mockRejectedValue(new Error("404: Not Found"));

            const response = await request(app)
                .delete('/api/v1/package/byName/testpackage')
                .set('X-Authorization', 'bearer fake_token')
                .expect(404);

            expect(response.body.description).toEqual("Package does not exist.");
        });

        it("should return 500 if internal server error", async () => {
            jest.spyOn(PackageName, 'isValidGetByNameRequest').mockReturnValue(true);
            jest.spyOn(PackageService.prototype, 'deletePackageByName').mockRejectedValue(new Error("500: Internal Server Error"));

            const response = await request(app)
                .delete('/api/v1/package/byName/testpackage')
                .set('X-Authorization', 'bearer fake_token')
                .expect(500);

            expect(response.body.description).toEqual("Internal Server Error");
        });

        it("should return 200 if successful", async () => {
            jest.spyOn(PackageName, 'isValidGetByNameRequest').mockReturnValue(true);
            jest.spyOn(PackageService.prototype, 'deletePackageByName').mockResolvedValue(void 0);

            const response = await request(app)
                .delete('/api/v1/package/byName/testpackage')
                .set('X-Authorization', 'bearer fake_token')
                .expect(200);

            expect(response.body.description).toEqual("Successfully deleted package via name.");
        });
    });
});