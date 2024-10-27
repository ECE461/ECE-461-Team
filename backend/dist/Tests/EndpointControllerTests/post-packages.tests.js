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
const supertest_1 = __importDefault(require("supertest"));
const PackageEndpoints_1 = require("../../src/endpoints/PackageEndpoints");
const PackageQueryController_1 = require("../../src/controllers/PackageQueryController");
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
    let app;
    beforeAll(() => {
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        const packageEndpoints = new PackageEndpoints_1.PackageEndpoints();
        app.use('/api/v1', packageEndpoints.getRouter());
    });
    it('should return 200 and package metadata when valid query is provided', () => __awaiter(void 0, void 0, void 0, function* () {
        const validQuery = [
            {
                Name: 'TestPackage',
                Version: '1.2.3'
            }
        ];
        const response = yield (0, supertest_1.default)(app)
            .post('/api/v1/packages')
            .send(validQuery)
            .expect('Content-Type', /json/)
            .expect(200);
        expect(response.body).toEqual([
            { Version: '1.2.3', Name: 'TestPackage', ID: 'testpackage' }
        ]);
    }));
    it('should return 400 for invalid package query', () => __awaiter(void 0, void 0, void 0, function* () {
        // Missing Name
        const invalidQuery = [
            {
                Name: '',
                Version: '1.2.3'
            }
        ];
        const response = yield (0, supertest_1.default)(app)
            .post('/api/v1/packages')
            .send(invalidQuery)
            .expect(400);
        expect(response.body.message).toEqual(PackageQueryController_1.PackageQueryController.MSG_INVALID.message);
        // Missing Version
        const invalidQuery2 = [
            {
                Name: 'Yah'
            }
        ];
        const response2 = yield (0, supertest_1.default)(app)
            .post('/api/v1/packages')
            .send(invalidQuery2)
            .expect(400);
        expect(response2.body.message).toEqual(PackageQueryController_1.PackageQueryController.MSG_INVALID.message);
        // Invalid Version1
        const invalidQuery3 = [
            {
                Name: 'Yah',
                Version: '1.2.3-1.2.a'
            }
        ];
        const response3 = yield (0, supertest_1.default)(app)
            .post('/api/v1/packages')
            .send(invalidQuery3)
            .expect(400);
        expect(response3.body.message).toEqual(PackageQueryController_1.PackageQueryController.MSG_INVALID.message);
        // Invalid Version2
        const invalidQuery4 = [
            {
                Name: 'Yah',
                Version: '1 2.3'
            }
        ];
        const response4 = yield (0, supertest_1.default)(app)
            .post('/api/v1/packages')
            .send(invalidQuery4)
            .expect(400);
        expect(response4.body.message).toEqual(PackageQueryController_1.PackageQueryController.MSG_INVALID.message);
    }));
    it('should return 400 for invalid offset', () => __awaiter(void 0, void 0, void 0, function* () {
        const validQuery = [
            {
                Name: 'TestPackage',
                Version: '1.2.3'
            }
        ];
        const response = yield (0, supertest_1.default)(app)
            .post('/api/v1/packages?offset=-1') // Invalid offset
            .send(validQuery)
            .expect(400);
        expect(response.body.message).toEqual(PackageQueryController_1.PackageQueryController.MSG_INVALID.message);
        const response2 = yield (0, supertest_1.default)(app)
            .post('/api/v1/packages?offset=1.6') // Invalid offset
            .send(validQuery)
            .expect(400);
        expect(response2.body.message).toEqual(PackageQueryController_1.PackageQueryController.MSG_INVALID.message);
        const response3 = yield (0, supertest_1.default)(app)
            .post('/api/v1/packages?offset=a') // Invalid offset
            .send(validQuery)
            .expect(400);
        expect(response3.body.message).toEqual(PackageQueryController_1.PackageQueryController.MSG_INVALID.message);
    }));
    it('should return 500 for internal server error', () => __awaiter(void 0, void 0, void 0, function* () {
        jest.spyOn(PackageQueryController_1.PackageQueryController.packageService, 'getPackagesByQuery').mockRejectedValueOnce(new Error('Database error'));
        const validQuery = [
            {
                Name: 'TestPackage',
                Version: '1.2.3'
            }
        ];
        const response = yield (0, supertest_1.default)(app)
            .post('/api/v1/packages')
            .send(validQuery)
            .expect(500);
        expect(response.body.message).toEqual('Internal Server Error');
    }));
});
