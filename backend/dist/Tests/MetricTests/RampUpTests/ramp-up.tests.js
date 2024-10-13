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
const axios_1 = require("axios");
const axios_2 = __importDefault(require("axios"));
const RampUp_1 = require("../../../src/services/metrics/RampUp");
require('dotenv').config();
jest.mock('axios');
describe('Ramp Up Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('Get Repo Stats', () => __awaiter(void 0, void 0, void 0, function* () {
        axios_2.default.get.mockResolvedValueOnce({
            data: {
                size: 5000000,
                stargazers_count: 500,
                forks_count: 100
            }
        }).mockResolvedValueOnce({
            data: [
                { type: 'file' },
                { type: 'file' }
            ]
        }).mockResolvedValueOnce({
            data: {
                content: Buffer.from(JSON.stringify({
                    dependencies: {
                        "axios": "^0.21.1"
                    }
                })).toString('base64')
            }
        });
        const repo = new RampUp_1.RampUp('cloudinary', 'cloudinary_npm');
        const stats = yield repo.getRampUpScore();
        expect(stats).toBe(0.829);
    }));
    test('Get different repo stats', () => __awaiter(void 0, void 0, void 0, function* () {
        axios_2.default.get.mockResolvedValueOnce({
            data: {
                size: 3000000,
                stargazers_count: 1000,
                forks_count: 200
            }
        }).mockResolvedValueOnce({
            data: [
                { type: 'file' },
                { type: 'file' },
                { type: 'file' }
            ]
        }).mockResolvedValueOnce({
            data: {
                content: Buffer.from(JSON.stringify({
                    dependencies: {
                        "lodash": "^4.17.21"
                    }
                })).toString('base64')
            }
        });
        const repo = new RampUp_1.RampUp('lodash', 'lodash');
        const stats = yield repo.getRampUpScore();
        expect(stats).toBe(0.896);
    }));
    test('Get empty repo', () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const repo = new RampUp_1.RampUp('', '');
            yield repo.getRampUpScore();
        }
        catch (error) {
            expect(error).toBeInstanceOf(axios_1.AxiosError);
        }
    }));
    /*
        test('Get Repo Stats', async () => {
            const repo = new RampUp('cloudinary', 'cloudinary_npm');
            const stats = await repo.getRampUpScore();
            expect(stats).toBe(0.985);
    
        });
    
        test('Get different repo stats', async () => {
            const repo = new RampUp('lodash', 'lodash');
            const fileCount = await repo.getRampUpScore();
            expect(fileCount).toBe(.992);
    
        });
    
        test('Get empty repo', async () => {
            try {
                const repo = new RampUp('', '');
                await repo.getRampUpScore();
            } catch (error) {
                expect(error).toBeInstanceOf(AxiosError);
            }
    
        });
     */
});
