import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { getPullRequestFraction } from '../../../src/services/metrics/Dependency';

const mock = new MockAdapter(axios);

describe('getPullRequestFraction Tests', () => {
    const repoOwner = 'test-owner';
    const repoName = 'test-repo';

    afterEach(() => {
        mock.reset();
    });

    test('Calculates fraction when pull requests exist', async () => {
        mock.onGet(`https://api.github.com/repos/${repoOwner}/${repoName}/pulls?state=all`).reply(200, [
            { commits_url: 'http://api.github.com/repos/test-repo/commits/1' },
        ]);
        mock.onGet('http://api.github.com/repos/test-repo/commits/1').reply(200, [{}, {}]); 

        const fraction = await getPullRequestFraction(repoOwner, repoName);
        expect(fraction).toBe(1.0); // All commits came from pull requests
    });

    test('Handles repositories with no pull requests', async () => {
        mock.onGet(`https://api.github.com/repos/${repoOwner}/${repoName}/pulls?state=all`).reply(200, []);
        const fraction = await getPullRequestFraction(repoOwner, repoName);
        expect(fraction).toBe(0.0); // No pull requests
    });

    test('Handles API error during pull request retrieval', async () => {
        mock.onGet(`https://api.github.com/repos/${repoOwner}/${repoName}/pulls?state=all`).reply(500);
        const fraction = await getPullRequestFraction(repoOwner, repoName);
        expect(fraction).toBe(0.0); 
    });
});
