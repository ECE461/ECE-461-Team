import { DependencyMetric, processPackages } from '../../../src/services/metrics/Dependency';
import axios, { AxiosResponse } from 'axios';
import { jest } from '@jest/globals';

// Ensure axios.get is treated as a Jest mock
jest.mock('axios');
const mockedAxiosGet = axios.get as jest.MockedFunction<typeof axios.get>;

describe('Dependency Metric Tests', () => {
    let metric: DependencyMetric;

    beforeEach(() => {
        jest.clearAllMocks();
        metric = new DependencyMetric();
    });

    test('Calculates pinned dependencies correctly', async () => {
        // Define the type for the response data
        const packageJsonResponse = {
            data: {
                name: 'test-package',
                version: '1.0.0',
                dependencies: {
                    dependency1: '1.2.3', // pinned
                    dependency2: '^1.3.0', // not pinned
                    dependency3: '~1.4.0', // not pinned
                    dependency4: '2.0.0'   // pinned
                }
            },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {}
        } as unknown as AxiosResponse<any>; // Force cast to AxiosResponse<any>

        const pullRequestsResponse = {
            data: [
                { commits_url: 'http://api.github.com/repos/test/repo/commits/1' },
                { commits_url: 'http://api.github.com/repos/test/repo/commits/2' }
            ],
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {}
        } as unknown as AxiosResponse<any>;

        const commitsResponse = {
            data: [{}, {}], // Simulate two commits per pull request
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {}
        } as unknown as AxiosResponse<any>;

        // Mock GitHub API responses for package.json and pull requests
        mockedAxiosGet.mockResolvedValueOnce(packageJsonResponse);
        mockedAxiosGet.mockResolvedValueOnce(pullRequestsResponse);
        mockedAxiosGet.mockResolvedValue(commitsResponse);

        // Ensure processPackages is imported and used correctly
        await processPackages('test', 'repo', metric);

        // Verify the pinned fraction and score
        const pinnedFraction = metric.getPinnedFraction('test-package', '1.0.0');
        expect(pinnedFraction).toBe(0.5); // 2 out of 4 dependencies are pinned

        const score = metric.getPackageScore('test-package', '1.0.0');
        expect(score).toBeCloseTo(0.6 * 0.5 + 0.4 * 1.0); // Weighted score
    });

    test('Handles repositories with no dependencies', async () => {
        const emptyPackageJsonResponse = {
            data: {
                name: 'empty-package',
                version: '1.0.0',
                dependencies: {}
            },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {}
        } as unknown as AxiosResponse<any>;

        const emptyPullRequestsResponse = {
            data: [
                { commits_url: 'http://api.github.com/repos/empty/repo/commits/1' }
            ],
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {}
        } as unknown as AxiosResponse<any>;

        const emptyCommitsResponse = {
            data: [{}],
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {}
        } as unknown as AxiosResponse<any>;

        mockedAxiosGet.mockResolvedValueOnce(emptyPackageJsonResponse);
        mockedAxiosGet.mockResolvedValueOnce(emptyPullRequestsResponse);
        mockedAxiosGet.mockResolvedValue(emptyCommitsResponse);

        await processPackages('empty', 'repo', metric);

        const pinnedFraction = metric.getPinnedFraction('empty-package', '1.0.0');
        expect(pinnedFraction).toBe(1.0); // No dependencies, should be 1.0

        const score = metric.getPackageScore('empty-package', '1.0.0');
        expect(score).toBeCloseTo(0.6 * 1.0 + 0.4 * 1.0); // Perfect score with no dependencies
    });

    test('Handles API errors gracefully', async () => {
        // Mock GitHub API error
        const error = new Error('Error fetching package.json') as unknown as AxiosResponse<any>;
        mockedAxiosGet.mockRejectedValueOnce(error);

        await expect(processPackages('invalid', 'repo', metric)).rejects.toThrow('Error fetching package.json');
    });
});