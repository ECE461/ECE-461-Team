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
const Maintainer_1 = require("../../../src/services/metrics/Maintainer");
const axios_1 = __importDefault(require("axios"));
require('dotenv').config();
jest.mock('axios');
describe('Maintainer Test 1', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('Get Maintainer Score for valid repository', () => __awaiter(void 0, void 0, void 0, function* () {
        axios_1.default.get.mockResolvedValueOnce({
            data: [{ commit: { author: { date: '2023-01-01T00:00:00Z' } } }]
        }).mockResolvedValueOnce({
            data: { open_issues_count: 10 }
        }).mockResolvedValueOnce({
            data: [{ number: 490 }]
        });
        const test = new Maintainer_1.Maintainer('hasansultan92', 'watch.js');
        const score = yield test.getMaintainerScore();
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
    }));
    test('Get Maintainer Score for different valid repository', () => __awaiter(void 0, void 0, void 0, function* () {
        axios_1.default.get.mockResolvedValueOnce({
            data: [{ commit: { author: { date: '2023-01-01T00:00:00Z' } } }]
        }).mockResolvedValueOnce({
            data: { open_issues_count: 20 }
        }).mockResolvedValueOnce({
            data: [{ number: 980 }]
        });
        const test = new Maintainer_1.Maintainer('mrdoob', 'three.js');
        const score = yield test.getMaintainerScore();
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
    }));
    test('Get Maintainer Score for repository with no issues', () => __awaiter(void 0, void 0, void 0, function* () {
        axios_1.default.get.mockResolvedValueOnce({
            data: [{ commit: { author: { date: '2023-01-01T00:00:00Z' } } }]
        }).mockResolvedValueOnce({
            data: { open_issues_count: 0 }
        }).mockResolvedValueOnce({
            data: []
        });
        const test = new Maintainer_1.Maintainer('prathameshnetake', 'libvlc');
        const score = yield test.getMaintainerScore();
        expect(score).toBe(0);
    }));
    test('Get Maintainer Score for repository with undefined closed issues', () => __awaiter(void 0, void 0, void 0, function* () {
        axios_1.default.get.mockResolvedValueOnce({
            data: [{ commit: { author: { date: '2023-01-01T00:00:00Z' } } }]
        }).mockResolvedValueOnce({
            data: { open_issues_count: 10 }
        }).mockResolvedValueOnce({
            data: [undefined]
        });
        const test = new Maintainer_1.Maintainer('socketio', 'socket.io');
        const score = yield test.getMaintainerScore();
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
    }));
    test('Get Maintainer Score for repository with error in getLastCommit', () => __awaiter(void 0, void 0, void 0, function* () {
        axios_1.default.get.mockRejectedValueOnce(new Error('Error when fetching last commit data'));
        const test = new Maintainer_1.Maintainer('invalid', 'repo');
        yield expect(test.getMaintainerScore()).rejects.toThrow('Error when fetching last commit data');
    }));
    test('Get Maintainer Score for repository with error in getOpenIssueRatioCount', () => __awaiter(void 0, void 0, void 0, function* () {
        axios_1.default.get.mockResolvedValueOnce({
            data: [{ commit: { author: { date: '2023-01-01T00:00:00Z' } } }]
        }).mockRejectedValueOnce(new Error('Error when fetching open issue ratio count'));
        const test = new Maintainer_1.Maintainer('invalid', 'repo');
        yield expect(test.getMaintainerScore()).rejects.toThrow('Error when fetching open issue ratio count');
    }));
    test('Get Maintainer Score for empty repository path', () => __awaiter(void 0, void 0, void 0, function* () {
        const test = new Maintainer_1.Maintainer('', '');
        yield expect(test.getMaintainerScore()).rejects.toThrow('Error when fetching last commit data');
    }));
});
