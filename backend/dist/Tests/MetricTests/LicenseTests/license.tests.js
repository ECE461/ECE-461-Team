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
const License_1 = require("../../../src/services/metrics/License");
const axios_1 = __importDefault(require("axios"));
require('dotenv').config();
jest.mock('axios');
const mockedAxios = axios_1.default;
describe('License Testing', () => {
    const owner = 'OwnerName';
    const repoName = 'RepoName';
    const findAlicense = new License_1.License(owner, repoName);
    afterEach(() => {
        jest.clearAllMocks();
    });
    test('getRepoLicense should return 1 if license is found', () => __awaiter(void 0, void 0, void 0, function* () {
        const defaultBranchResponse = {
            data: { default_branch: 'main' }
        };
        axios_1.default.get.mockResolvedValueOnce(defaultBranchResponse); // Mock repo default branch
        axios_1.default.get.mockResolvedValueOnce({
            data: 'This project is licensed under the LGPL v2.1 License.'
        }); // Mock LICENSE content
        axios_1.default.get.mockResolvedValueOnce({
            data: 'Some README content.'
        }); // Mock README content
        const result = yield findAlicense.getRepoLicense();
        expect(result).toBe(1);
    }));
    test('getRepoLicense should return 0 if license is not found', () => __awaiter(void 0, void 0, void 0, function* () {
        const defaultBranchResponse = {
            data: { default_branch: 'main' }
        };
        axios_1.default.get.mockResolvedValueOnce(defaultBranchResponse); // Mock repo default branch
        axios_1.default.get.mockResolvedValueOnce({
            data: 'No license information here.'
        }); // Mock LICENSE content
        axios_1.default.get.mockResolvedValueOnce({
            data: 'Some README content.'
        }); // Mock README content
        const result = yield findAlicense.getRepoLicense();
        expect(result).toBe(0);
    }));
    test('getRepoLicense should return 0 on error', () => __awaiter(void 0, void 0, void 0, function* () {
        axios_1.default.get.mockRejectedValueOnce(new Error('Network Error'));
        const result = yield findAlicense.getRepoLicense();
        expect(result).toBe(0);
    }));
});
