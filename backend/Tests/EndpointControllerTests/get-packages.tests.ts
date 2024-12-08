import express from 'express';
import request from 'supertest';
import { PackageEndpoints } from '../../src/endpoints/PackageEndpoints';
import { PackageQueryController } from '../../src/controllers/PackageQueryController';

jest.mock('../../src/services/package/PackageService', () => {
    return {
        PackageService: jest.fn().mockImplementation(() => {
            return {
                getRating: jest.fn().mockResolvedValue({
                    getJson: () => ({rating : 1.0})
                }),
                getCost: jest.fn().mockResolvedValue({
                    standaloneCost : 12345
                })
            };
        })
    };
});
jest.mock('../../src/models/authentication/AuthenticationRequest', () => {
    return {
        AuthenticationRequest: jest.fn().mockImplementation(() => {
            return {
                validateToken: jest.fn().mockResolvedValue(true)
            };
        })
    };
});


describe('GET /package/{id}/rate Test Endpoint and Controller', () => {
    let app: express.Application;

    beforeAll(() => {
        app = express();
        app.use(express.json());

        const packageEndpoints = new PackageEndpoints();
        app.use('/api/v1', packageEndpoints.getRouter());
    });

    it('should return 200 and rating if the package ID is valid', async () => {
        const validPackageId = 'testpackage';

        const response = await request(app)
            .get(`/api/v1/package/${validPackageId}/rate`)
            .set('X-Authorization', 'bearer fake_token')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body).toEqual({ rating: 1.0 });
    });

    it('should return 400 if the package ID is invalid', async () => {
        const invalidPackageId = 'invalidpackage***';

        const response = await request(app)
            .get(`/api/v1/package/${invalidPackageId}/rate`)
            .set('X-Authorization', 'bearer fake_token')
            .expect(400);

        expect(response.body).toEqual({ description: "There is missing field(s) in the PackageID" });
    });

    it('should return 500 if an internal error occurs', async () => {
        jest.spyOn(PackageQueryController.packageService, 'getRating').mockRejectedValueOnce(new Error('Internal Server Error'));
        const validPackageId = 'testpackage';

        const response = await request(app)
            .get(`/api/v1/package/${validPackageId}/rate`)
            .set('X-Authorization', 'bearer fake_token')
            .expect(500);

        expect(response.body).toEqual({ message: 'Internal Server Error' });
    });
});

describe('GET /package/{id}/cost Test Endpoint and Controller', () => {
    let app: express.Application;

    beforeAll(() => {
        app = express();
        app.use(express.json());

        const packageEndpoints = new PackageEndpoints();
        app.use('/api/v1', packageEndpoints.getRouter());
    });

    it('should return 400 if no dependency value included', async () => {
        const validPackageId = 'testpackage';

        const response = await request(app)
            .get(`/api/v1/package/${validPackageId}/cost`)
            .set('X-Authorization', 'bearer fake_token')
            .expect(400);

        expect(response.body).toEqual({ description: "There is missing field(s) in the PackageID" });
    });

    it('should return 400 if the dependency value is invalid', async () => {
        const validPackageId = 'testpackage';
        const invalidDependency = 'invalid';

        const response = await request(app)
            .get(`/api/v1/package/${validPackageId}/cost?dependency=${invalidDependency}`)
            .set('X-Authorization', 'bearer fake_token')
            .expect(400);

        expect(response.body).toEqual({ description: "There is missing field(s) in the PackageID" });
    });

    it('should return 400 if the package ID is invalid', async () => {
        const invalidPackageId = 'invalidpackage***';
        const dependency = 'true';

        const response = await request(app)
            .get(`/api/v1/package/${invalidPackageId}/cost?dependency=${dependency}`)
            .set('X-Authorization', 'bearer fake_token')
            .expect(400);

        expect(response.body).toEqual({ description: "There is missing field(s) in the PackageID" });
    });

    it ('should return 500 if an internal error occurs', async () => {
        jest.spyOn(PackageQueryController.packageService, 'getCost').mockRejectedValueOnce(new Error('Internal Server Error'));
        const validPackageId = 'testpackage';
        const dependency = 'true';

        const response = await request(app)
            .get(`/api/v1/package/${validPackageId}/cost?dependency=${dependency}`)
            .set('X-Authorization', 'bearer fake_token')
            .expect(500);

        expect(response.body).toEqual({ message: "Internal Server Error" });
    });

    it('should return 200 and cost if the package ID and request is valid', async () => {
        const validPackageId = 'testpackage';
        const dependency = 'true';

        const response = await request(app)
            .get(`/api/v1/package/${validPackageId}/cost?dependency=${dependency}`)
            .set('X-Authorization', 'bearer fake_token')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body).toEqual({ standaloneCost: 12345 });
    });
});