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
Object.defineProperty(exports, "__esModule", { value: true });
const MetricManager_1 = require("../../../src/services/metrics/MetricManager");
require('dotenv').config();
jest.mock('../../../src/services/metrics/BusFactor', () => ({
    BusFactor: jest.fn().mockImplementation(() => ({
        calculateBusFactor: jest.fn().mockResolvedValue(0.5)
    }))
}));
jest.mock('../../../src/services/metrics/Maintainer', () => ({
    Maintainer: jest.fn().mockImplementation(() => ({
        getMaintainerScore: jest.fn().mockResolvedValue(0.8)
    }))
}));
jest.mock('../../../src/services/metrics/RampUp', () => ({
    RampUp: jest.fn().mockImplementation(() => ({
        getRampUpScore: jest.fn().mockResolvedValue(0.992)
    }))
}));
jest.mock('../../../src/services/metrics/License', () => ({
    License: jest.fn().mockImplementation(() => ({
        getRepoLicense: jest.fn().mockResolvedValue(1)
    }))
}));
jest.mock('../../../src/services/metrics/Correctness', () => ({
    Correctness: jest.fn().mockImplementation(() => ({
        getCorrectnessScore: jest.fn().mockResolvedValue(0.85)
    }))
}));
describe('Metric Manager Tests', () => {
    test('Get Metrics for valid repository', () => __awaiter(void 0, void 0, void 0, function* () {
        const manager = new MetricManager_1.MetricManager('cloudinary/cloudinary_npm');
        const metrics = yield manager.getMetrics();
        expect(metrics).toEqual({
            netScore: 0.758,
            netLatency: expect.any(Number),
            rampUpValue: 0.992,
            rampUpLatency: expect.any(Number),
            correctnessValue: 0.85,
            correctnessLatency: expect.any(Number),
            busFactorValue: 0.5,
            busFactorLatency: expect.any(Number),
            maintainerValue: 0.8,
            maintainerLatency: expect.any(Number),
            licenseValue: 1,
            licenseLatency: expect.any(Number)
        });
    }));
    test('Get Metrics for different valid repository', () => __awaiter(void 0, void 0, void 0, function* () {
        const manager = new MetricManager_1.MetricManager('lodash/lodash');
        const metrics = yield manager.getMetrics();
        expect(metrics).toEqual({
            netScore: 0.758,
            netLatency: expect.any(Number),
            rampUpValue: 0.992,
            rampUpLatency: expect.any(Number),
            correctnessValue: 0.85,
            correctnessLatency: expect.any(Number),
            busFactorValue: 0.5,
            busFactorLatency: expect.any(Number),
            maintainerValue: 0.8,
            maintainerLatency: expect.any(Number),
            licenseValue: 1,
            licenseLatency: expect.any(Number)
        });
    }));
    test('Get Metrics for invalid repository path', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(() => new MetricManager_1.MetricManager('invalidpath')).toThrow('Invalid GitHub repository URL');
    }));
    test('Get Metrics for empty repository path', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(() => new MetricManager_1.MetricManager('')).toThrow('Invalid GitHub repository URL');
    }));
    test('get owner and repo name', () => __awaiter(void 0, void 0, void 0, function* () {
        const manager = new MetricManager_1.MetricManager('cloudinary/cloudinary_npm');
        const owner = manager.getOwner();
        const repo = manager.getRepoName();
        expect(owner).toBe('cloudinary');
        expect(repo).toBe('cloudinary_npm');
    }));
    /* test('Get Metrics', async () => {
        const manager = new MetricManager('cloudinary/cloudinary_npm');
        const metrics = await manager.getMetrics();
        expect(metrics).toBe('');
    });

    test('Get different metrics', async () => {
        const manager = new MetricManager('lodash/lodash');
        const metrics = await manager.getMetrics();
        expect(metrics).toBe('Metrics: [ '+
        '\n URL:' +
        'busFactorValue: 0.5 (Latency: 0.255 s)' +
        'rampUpValue: 0.992 (Latency: 0.362 s)' +
        'licenseValue: 1 (Latency: 0.426 s)' +
        'maintainerValue: 0.8 (Latency: 0.619 s)' +
        'correctnessValue: 0.85 (Latency: 1.056 s)' +
        'Net Score: 0.758 (Latency: 2.719 s)' +
        ' ] for lodash / lodash');
    });

    test('Get empty metrics', async () => {
        try {
            const manager = new MetricManager('');
            await manager.getMetrics();
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
        }

    }); */
});
