import express from 'express';
import request from 'supertest';
import { PackageEndpoints } from '../../src/endpoints/PackageEndpoints';
import { PackageQueryController } from '../../src/controllers/PackageQueryController';
import { valid } from 'joi';
import { PackageData } from '../../src/models/package/PackageData';

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
jest.mock('../../src/models/authentication/AuthenticationRequest', () => {
    return {
        AuthenticationRequest: jest.fn().mockImplementation(() => {
            return {
                validateToken: jest.fn().mockResolvedValue(true)
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
            .set('X-Authorization', 'bearer fake_token')
            .send(validQuery)
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body).toEqual([
            { Version: '1.2.3', Name: 'TestPackage', ID: 'testpackage' }
        ]);

        // Missing version but name provided
        const validQuery2 = [
            {
                Name: 'Yah'
            }
        ];
        const response2 = await request(app)
            .post('/api/v1/packages')
            .set('X-Authorization', 'bearer fake_token')
            .send(validQuery2)
            .expect(200);
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
            .set('X-Authorization', 'bearer fake_token')
            .send(invalidQuery)
            .expect(400);
        expect(response.body.description).toEqual("There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.");

        // Invalid Version1
        const invalidQuery3 = [
            {
                Name: 'Yah',
                Version: '1.2.3-1.2.a'
            }
        ];
        const response3 = await request(app)
            .post('/api/v1/packages')
            .set('X-Authorization', 'bearer fake_token')
            .send(invalidQuery3)
            .expect(400);
        expect(response3.body.description).toEqual("There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.");

        // Invalid Version2
        const invalidQuery4 = [
            {
                Name: 'Yah',
                Version: '1 2.3'
            }
        ];
        const response4 = await request(app)
            .post('/api/v1/packages')
            .set('X-Authorization', 'bearer fake_token')
            .send(invalidQuery4)
            .expect(400);
        expect(response4.body.description).toEqual("There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.");
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
            .set('X-Authorization', 'bearer fake_token')
            .send(validQuery)
            .expect(400);

        expect(response.body.description).toEqual("There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.");

        const response2 = await request(app)
            .post('/api/v1/packages?offset=1.6') // Invalid offset
            .set('X-Authorization', 'bearer fake_token')
            .send(validQuery)
            .expect(400);

        expect(response2.body.description).toEqual("There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.");

        const response3 = await request(app)
            .post('/api/v1/packages?offset=a') // Invalid offset
            .set('X-Authorization', 'bearer fake_token')
            .send(validQuery)
            .expect(400);

        expect(response3.body.description).toEqual("There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.");
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
            .set('X-Authorization', 'bearer fake_token')
            .send(validQuery)
            .expect(500);

        expect(response.body.message).toEqual('Internal Server Error');
    });

    describe("POST /package endpoint tests", () => {
        it("should return an error for an invalid query", async () => {
            jest.spyOn(PackageData, 'isValidUploadRequestBody').mockReturnValue(false);

            // Content/URL is missing
            const invalidQuery = [
                {
                    Name: '',
                    Version: '1.2.3'
                }
            ];
            const response = await request(app)
                .post('/api/v1/packages')
                .set('X-Authorization', 'bearer fake_token')
                .send(invalidQuery)
                .expect(400);

            expect(response.body.description).toEqual("There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.");
        });
    });
});
