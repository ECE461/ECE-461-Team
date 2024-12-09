import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { getPackageJson } from '../../../src/services/metrics/Dependency';

const mock = new MockAdapter(axios);

describe('getPackageJson Tests', () => {
    const repoOwner = 'test-owner';
    const repoName = 'test-repo';

    afterEach(() => {
        mock.reset();
    });

    test('Successfully retrieves package.json', async () => {
        mock.onGet(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/package.json`).reply(200, {
            name: 'valid-package',
            version: '1.0.0',
            dependencies: {
                dep1: '1.0.0',
                dep2: '^2.0.0',
            },
        });

        const result = await getPackageJson(repoOwner, repoName);
        expect(result.name).toBe('valid-package');
        expect(result.version).toBe('1.0.0');
        expect(result.dependencies).toHaveProperty('dep1');
    });

    test('Handles missing package.json gracefully', async () => {
        mock.onGet(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/package.json`).reply(404);
        const result = await getPackageJson(repoOwner, repoName);
        expect(result).toBeUndefined(); // Logger should catch the error
    });

    test('Handles invalid GitHub token or API error', async () => {
        mock.onGet(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/package.json`).reply(403);
        const result = await getPackageJson(repoOwner, repoName);
        expect(result).toBeUndefined(); 
    });
});
