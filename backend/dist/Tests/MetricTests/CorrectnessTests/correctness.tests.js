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
const Correctness_1 = require("../../../src/services/metrics/Correctness");
require('dotenv').config();
jest.setTimeout(20000); // Set timeout to 10 seconds
describe('Correctness Score Testing', () => {
    test('Perfect Score', () => __awaiter(void 0, void 0, void 0, function* () {
        const perfectScore = new Correctness_1.Correctness('cloudinary', 'cloudinary_npm');
        const correctness_score = yield perfectScore.getCorrectnessScore();
        expect(correctness_score).toBe(1);
    }));
    test('No Test Cases and no Linters', () => __awaiter(void 0, void 0, void 0, function* () {
        const fishAudio = new Correctness_1.Correctness('fishaudio', 'fish-speech');
        const correctness_score = yield fishAudio.getCorrectnessScore();
        expect(correctness_score).toBe(0.75);
    }));
    test('Only README and dependencies', () => __awaiter(void 0, void 0, void 0, function* () {
        const find = new Correctness_1.Correctness('AidanMDB', 'ECE-461-Team');
        const val = yield find.getCorrectnessScore();
        expect(val).toBe(0.65);
    }));
    test('NOTHING', () => __awaiter(void 0, void 0, void 0, function* () {
        const empty = new Correctness_1.Correctness('gsaniya', 'test-Repo-461');
        const val = yield empty.getCorrectnessScore();
        expect(val).toBe(0);
    }));
});
