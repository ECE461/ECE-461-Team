import { get } from 'http';
import { Correctness } from '../../../src/services/metrics/Correctness';
require('dotenv').config();
import * as git from 'isomorphic-git';
import { after, before } from 'node:test';
import { clear } from 'console';

jest.setTimeout(20000); // Set timeout to 20 seconds

describe ('Correctness Score Testing', () => {

    describe('getCorrectnessScore()', () => {
        it ("should return a perfect score when all checks pass", async () => {
            const correctness = new Correctness('test_owner', 'test_name');
            jest.spyOn(correctness as any, 'checkReadme').mockResolvedValue(true);
            jest.spyOn(correctness as any, 'checkStability').mockResolvedValue(true);
            jest.spyOn(correctness as any, 'checkTests').mockResolvedValue(true);
            jest.spyOn(correctness as any, 'checkLinters').mockResolvedValue(true);
            jest.spyOn(correctness as any, 'checkDependencies').mockResolvedValue(true);

            const score = await correctness.getCorrectnessScore();
            expect(score).toBe(1);
        });

        it ("should return a score of 0.60 when there are no test cases and no linters", async () => {
            const correctness = new Correctness('test_owner', 'test_name');
            jest.spyOn(correctness as any, 'checkReadme').mockResolvedValue(true);
            jest.spyOn(correctness as any, 'checkStability').mockResolvedValue(true);
            jest.spyOn(correctness as any, 'checkTests').mockResolvedValue(false);
            jest.spyOn(correctness as any, 'checkLinters').mockResolvedValue(false);
            jest.spyOn(correctness as any, 'checkDependencies').mockResolvedValue(true);

            const score = await correctness.getCorrectnessScore();
            expect(score).toBe(0.60);
        });

        it ("should return a score of 0 when no checks pass", async () => {
            const correctness = new Correctness('test_owner', 'test_name');
            jest.spyOn(correctness as any, 'checkReadme').mockResolvedValue(false);
            jest.spyOn(correctness as any, 'checkStability').mockResolvedValue(false);
            jest.spyOn(correctness as any, 'checkTests').mockResolvedValue(false);
            jest.spyOn(correctness as any, 'checkLinters').mockResolvedValue(false);
            jest.spyOn(correctness as any, 'checkDependencies').mockResolvedValue(false);

            const score = await correctness.getCorrectnessScore();
            expect(score).toBe(0);
        });

    });

    describe('checkReadme()', () => {
        it ("should return true when the README file exists", async () => {
            const correctness = new Correctness('test_owner', 'test_name');
            (correctness as any).repoContents = ['README.md'];
            const result = await (correctness as any).checkReadme();
            expect(result).toBe(true);
        });

        it ("should return false when the README file does not exist", async () => {
            const correctness = new Correctness('test_owner', 'test_name');
            (correctness as any).repoContents = [];
            const result = await (correctness as any).checkReadme();
            expect(result).toBe(false);
        });
    });

    describe('checkTests()', () => {
        it ("should return true when the repository has test cases", async () => {
            const correctness = new Correctness('test_owner', 'test_name');
            (correctness as any).repoContents = ["/tests/test1.js", "/tests/test2.js", "/tests/test3.js"];
            const result = await (correctness as any).checkTests();
            expect(result).toBe(true);
        });

        it ("should return false when the repository has no test cases", async () => {
            const correctness = new Correctness('test_owner', 'test_name');
            (correctness as any).repoContents = [];
            const result = await (correctness as any).checkTests();
            expect(result).toBe(false);
        });
    });

    describe('checkLinters()', () => {
        it ("should return true when the repository has linter files", async () => {
            const correctness = new Correctness('test_owner', 'test_name');
            (correctness as any).repoContents = [".eslintrc", ".stylelintrc"];
            const result = await (correctness as any).checkLinters();
            expect(result).toBe(true);
        });

        it ("should return false when the repository has no linter files", async () => {
            const correctness = new Correctness('test_owner', 'test_name');
            (correctness as any).repoContents = [];
            const result = await (correctness as any).checkLinters();
            expect(result).toBe(false);
        });
    });

    describe('checkDependencies()', () => {
        it ("should return false when no package.json file exists", async () => {
            const correctness = new Correctness('test_owner', 'test_name');
            (correctness as any).repoContents = [];
            const result = await (correctness as any).checkDependencies();
            expect(result).toBe(false);
        });

    });
    
});
