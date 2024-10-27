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
const BusFactor_1 = require("../../../src/services/metrics/BusFactor");
const axios_1 = __importDefault(require("axios"));
require('dotenv').config();
jest.mock('axios');
const mockedAxios = axios_1.default;
describe('BusFactor', () => {
    let busFactorInstance;
    beforeEach(() => {
        busFactorInstance = new BusFactor_1.BusFactor('repoOwner', 'repoName');
    });
    describe('calculateBusFactor', () => {
        it('should return the correct bus factor score based on the number of contributors', () => __awaiter(void 0, void 0, void 0, function* () {
            const commits = [
                { commit: { author: { name: 'Alice' } } },
                { commit: { author: { name: 'Bob' } } },
                { commit: { author: { name: 'Alice' } } },
                { commit: { author: { name: 'Charlie' } } },
                { commit: { author: { name: 'David' } } },
                { commit: { author: { name: 'Eve' } } },
                { commit: { author: { name: 'Frank' } } },
                { commit: { author: { name: 'Grace' } } },
                { commit: { author: { name: 'Heidi' } } },
                { commit: { author: { name: 'Ivan' } } },
                { commit: { author: { name: 'Judy' } } },
            ]; // Mock 10 unique contributors
            mockedAxios.get.mockResolvedValue({ data: commits });
            const result = yield busFactorInstance.calculateBusFactor();
            expect(result).toBe(1); // Expecting bus factor score of 1 for 10 contributors
        }));
        it('should return 0 and exit process if there is an error fetching commits', () => __awaiter(void 0, void 0, void 0, function* () {
            const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit: mock'); });
            mockedAxios.get.mockRejectedValue(new Error('Network Error'));
            yield expect(busFactorInstance.calculateBusFactor()).rejects.toThrow('process.exit: mock');
            expect(exitSpy).toHaveBeenCalledWith(1);
        }));
    });
    describe('calculateBusFactorScore', () => {
        it('should return 1 for 10 or more contributors', () => {
            const result = busFactorInstance['calculateBusFactorScore'](10);
            expect(result).toBe(1);
        });
        it('should return 0.5 for 5 to 9 contributors', () => {
            const result = busFactorInstance['calculateBusFactorScore'](5);
            expect(result).toBe(0.5);
        });
        it('should return 0.3 for 2 to 4 contributors', () => {
            const result = busFactorInstance['calculateBusFactorScore'](3);
            expect(result).toBe(0.3);
        });
        it('should return 0.1 for 1 contributor', () => {
            const result = busFactorInstance['calculateBusFactorScore'](1);
            expect(result).toBe(0.1);
        });
        it('should return 0 for 0 contributors', () => {
            const result = busFactorInstance['calculateBusFactorScore'](0);
            expect(result).toBe(0);
        });
    });
});
