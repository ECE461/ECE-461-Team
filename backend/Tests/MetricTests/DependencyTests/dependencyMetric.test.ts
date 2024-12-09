import { DependencyMetric } from '../../../src/services/metrics/Dependency';

describe('DependencyMetric Class Tests', () => {
    let matrix: DependencyMetric;

    beforeEach(() => {
        matrix = new DependencyMetric();
    });

    test('Add package with valid dependencies', () => {
        const dependencies: [string, string][] = [
            ['dep1', '1.0.0'], // pinned
            ['dep2', '^2.0.0'] // not pinned
        ];
        matrix.addPackage('test-package', '1.0.0', dependencies, 0.8);
        const pinnedFraction = matrix.getPinnedFraction('test-package', '1.0.0');
        expect(pinnedFraction).toBe(0.5); 
        const score = matrix.getPackageScore('test-package', '1.0.0');
        expect(score).toBeCloseTo(0.6 * 0.5 + 0.4 * 0.8); 
    });

    test('Add package with empty dependencies', () => {
        const dependencies: [string, string][] = []; 
        matrix.addPackage('empty-package', '1.0.0', dependencies, 0.5);
        const pinnedFraction = matrix.getPinnedFraction('empty-package', '1.0.0');
        expect(pinnedFraction).toBe(1.0); 
        const score = matrix.getPackageScore('empty-package', '1.0.0');
        expect(score).toBeCloseTo(0.7); 
    });
});