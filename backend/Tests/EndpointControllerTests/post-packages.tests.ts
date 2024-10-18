import express from 'express';
import request from 'supertest';
import { PackageEndpoints } from '../../src/endpoints/PackageEndpoints';
import { PackageQueryController } from '../../src/controllers/PackageQueryController';

jest.mock('../../src/services/package/PackageService', () => {
    return {
        PackageService: jest.fn().mockImplementation(() => {
            return {
                getPackagesByQuery: jest.fn().mockResolvedValue([
                    { Version: '1.2.3', Name: 'TestPackage', ID: 'testpackage' }
                ])
            };
        })
    };
});


describe('POST /packages Test Endpoint and Controller', () => {
    let app: express.Application;

    beforeAll(() => {
        app = express();
        app.use(express.json());

        const packageEndpoints = new PackageEndpoints();
        app.use('/api/v1', packageEndpoints.getRouter());
    });

    it('should return 200 and package metadata when valid query is provided', async () => {
        const validQuery = [
            {
                Name: 'TestPackage',
                Version: '1.2.3'
            }
        ];

        const response = await request(app)
            .post('/api/v1/packages')
            .send(validQuery)
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body).toEqual([
            { Version: '1.2.3', Name: 'TestPackage', ID: 'testpackage' }
        ]);
    });

    it('should return 400 for invalid package query', async () => {
        // Missing Name
        const invalidQuery = [
            {
                Name: '', // Invalid, name is required
                Version: '1.2.3'
            }
        ];
        const response = await request(app)
            .post('/api/v1/packages')
            .send(invalidQuery)
            .expect(400);
        expect(response.body.message).toEqual(PackageQueryController.MSG_INVALID.message);

        // Missing Version
        const invalidQuery2 = [
            {
                Name: 'Yah'
            }
        ];
        const response2 = await request(app)
            .post('/api/v1/packages')
            .send(invalidQuery2)
            .expect(400);
        expect(response2.body.message).toEqual(PackageQueryController.MSG_INVALID.message);

        // Invalid Version1
        const invalidQuery3 = [
            {
                Name: 'Yah',
                Version: '1.2.3-1.2.a'
            }
        ];
        const response3 = await request(app)
            .post('/api/v1/packages')
            .send(invalidQuery3)
            .expect(400);
        expect(response3.body.message).toEqual(PackageQueryController.MSG_INVALID.message);

        // Invalid Version2
        const invalidQuery4 = [
            {
                Name: 'Yah',
                Version: '1 2.3'
            }
        ];
        const response4 = await request(app)
            .post('/api/v1/packages')
            .send(invalidQuery4)
            .expect(400);
        expect(response4.body.message).toEqual(PackageQueryController.MSG_INVALID.message);
    });

    it('should return 400 for invalid offset', async () => {
        const validQuery = [
            {
                Name: 'TestPackage',
                Version: '1.2.3'
            }
        ];

        const response = await request(app)
            .post('/api/v1/packages?offset=-1') // Invalid offset
            .send(validQuery)
            .expect(400);

        expect(response.body.message).toEqual(PackageQueryController.MSG_INVALID.message);

        const response2 = await request(app)
            .post('/api/v1/packages?offset=1.6') // Invalid offset
            .send(validQuery)
            .expect(400);

        expect(response2.body.message).toEqual(PackageQueryController.MSG_INVALID.message);

        const response3 = await request(app)
            .post('/api/v1/packages?offset=a') // Invalid offset
            .send(validQuery)
            .expect(400);

        expect(response3.body.message).toEqual(PackageQueryController.MSG_INVALID.message);
    });

    it('should return 500 for internal server error', async () => {
        jest.spyOn(PackageQueryController.packageService, 'getPackagesByQuery').mockRejectedValueOnce(new Error('Database error'));

        const validQuery = [
            {
                Name: 'TestPackage',
                Version: '1.2.3'
            }
        ];

        const response = await request(app)
            .post('/api/v1/packages')
            .send(validQuery)
            .expect(500);

        expect(response.body.message).toEqual('Internal Server Error');
    });
});
