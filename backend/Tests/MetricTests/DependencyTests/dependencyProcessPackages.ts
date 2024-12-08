import { processPackages, DependencyMetric } from '../../../src/services/metrics/Dependency';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

const mock = new MockAdapter(axios);

describe('processPackages Tests', () => {
    const repoOwner = 'test-owner';
    const repoName = 'test-repo';
    let matrix: DependencyMetric;

    beforeEach(() => {
        matrix = new DependencyMetric();
    });

    afterEach(() => {
        mock.reset();
    });

    test('Successfully processes a valid package', async () => {
        mock.onGet(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/package.json`).reply(200, {
            name: 'valid-package',
            version: '1.0.0',
            dependencies: { dep1: '1.0.0', dep2: '^2.0.0' },
        });
        mock.onGet(`https://api.github.com/repos/${repoOwner}/${repoName}/pulls?state=all`).reply(200, []);

        await processPackages(repoOwner, repoName, matrix);
        const score = matrix.getPackageScore('valid-package', '1.0.0');
        expect(score).toBeDefined();
    });

    test('Fails gracefully with missing package.json', async () => {
        mock.onGet(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/package.json`).reply(404);
        await processPackages(repoOwner, repoName, matrix);
        const score = matrix.getPackageScore('valid-package', '1.0.0');
        expect(score).toBe(0.0); // Package was not processed
    });
});
