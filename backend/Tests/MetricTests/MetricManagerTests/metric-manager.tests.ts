import { MetricManager } from '../../../src/services/metrics/MetricManager';
import { BusFactor } from '../../../src/services/metrics/BusFactor';
import { Correctness } from '../../../src/services/metrics/Correctness';
import * as dependency from '../../../src/services/metrics/Dependency';
import { License } from '../../../src/services/metrics/License';
import { Maintainer } from '../../../src/services/metrics/Maintainer';
import { PullRequest } from '../../../src/services/metrics/PullRequest';
import { RampUp } from '../../../src/services/metrics/RampUp';
import { get } from 'http';
require('dotenv').config();

describe('Metric Manager Tests', () => {
    it ('should return 1 when all subscores are 1', async () => {
      // have to mock dependency getJson as well
      jest.spyOn(dependency, 'getPackageJson').mockResolvedValue({
        "name": "my-package",
        "version": "1.0.0",
        "dependencies": {
          "express": "^4.17.1",
          "lodash": "^4.17.21"
        }
      });

      jest.spyOn(BusFactor.prototype, 'calculateBusFactor').mockResolvedValue(1);
      jest.spyOn(Correctness.prototype, 'getCorrectnessScore').mockResolvedValue(1);
      jest.spyOn(dependency.DependencyMetric.prototype, 'getPackageScore').mockReturnValue(1);
      jest.spyOn(License.prototype, 'getRepoLicense').mockResolvedValue(1);
      jest.spyOn(Maintainer.prototype, 'getMaintainerScore').mockResolvedValue(1);
      jest.spyOn(PullRequest.prototype, 'getPullRequest').mockResolvedValue(1);
      jest.spyOn(RampUp.prototype, 'getRampUpScore').mockResolvedValue(1);



      const manager = new MetricManager('cloudinary/cloudinary_npm');
      const metrics = await manager.getMetrics();
      expect(metrics.netScore).toBe(1);
    });

    it ('should return 0 when all subscores are 0', async () => {
      // have to mock dependency getJson as well
      jest.spyOn(dependency, 'getPackageJson').mockResolvedValue({
        "name": "my-package",
        "version": "1.0.0",
        "dependencies": {
          "express": "^4.17.1",
          "lodash": "^4.17.21"
        }
      });

      jest.spyOn(BusFactor.prototype, 'calculateBusFactor').mockResolvedValue(0);
      jest.spyOn(Correctness.prototype, 'getCorrectnessScore').mockResolvedValue(0);
      jest.spyOn(dependency.DependencyMetric.prototype, 'getPackageScore').mockReturnValue(0);
      jest.spyOn(License.prototype, 'getRepoLicense').mockResolvedValue(0);
      jest.spyOn(Maintainer.prototype, 'getMaintainerScore').mockResolvedValue(0);
      jest.spyOn(PullRequest.prototype, 'getPullRequest').mockResolvedValue(0);
      jest.spyOn(RampUp.prototype, 'getRampUpScore').mockResolvedValue(0);

      const manager = new MetricManager('cloudinary/cloudinary_npm');
      const metrics = await manager.getMetrics();
      expect(metrics.netScore).toBe(0);
    });


    // test('Get Metrics for different valid repository', async () => {
    //     const manager = new MetricManager('lodash/lodash');
    //     const metrics = await manager.getMetrics();
    //     expect(metrics).toEqual({
    //         netScore: 0.758,
    //         netLatency: expect.any(Number),
    //         rampUpValue: 0.992,
    //         rampUpLatency: expect.any(Number),
    //         correctnessValue: 0.85,
    //         correctnessLatency: expect.any(Number),
    //         busFactorValue: 0.5,
    //         busFactorLatency: expect.any(Number),
    //         maintainerValue: 0.8,
    //         maintainerLatency: expect.any(Number),
    //         licenseValue: 1,
    //         licenseLatency: expect.any(Number)
    //     });
    // });


    // test('Get Metrics for invalid repository path', async () => {
    //     expect(() => new MetricManager('invalidpath')).toThrow('Invalid GitHub repository URL');
    // });

    // test('Get Metrics for empty repository path', async () => {
    //     expect(() => new MetricManager('')).toThrow('Invalid GitHub repository URL');
    // });

    // test('get owner and repo name', async () => {
    //     const manager = new MetricManager('cloudinary/cloudinary_npm');
    //     const owner = manager.getOwner();
    //     const repo = manager.getRepoName();
    //     expect(owner).toBe('cloudinary');
    //     expect(repo).toBe('cloudinary_npm');
    // });
    // /* test('Get Metrics', async () => {
    //     const manager = new MetricManager('cloudinary/cloudinary_npm');
    //     const metrics = await manager.getMetrics();
    //     expect(metrics).toBe('');
    // });

    // test('Get different metrics', async () => {
    //     const manager = new MetricManager('lodash/lodash');
    //     const metrics = await manager.getMetrics();
    //     expect(metrics).toBe('Metrics: [ '+
    //     '\n URL:' +
    //     'busFactorValue: 0.5 (Latency: 0.255 s)' +
    //     'rampUpValue: 0.992 (Latency: 0.362 s)' +
    //     'licenseValue: 1 (Latency: 0.426 s)' +
    //     'maintainerValue: 0.8 (Latency: 0.619 s)' +
    //     'correctnessValue: 0.85 (Latency: 1.056 s)' +
    //     'Net Score: 0.758 (Latency: 2.719 s)' +
    //     ' ] for lodash / lodash');
    // });

    // test('Get empty metrics', async () => {
    //     try {
    //         const manager = new MetricManager('');
    //         await manager.getMetrics();
    //     } catch (error) {
    //         expect(error).toBeInstanceOf(Error);
    //     }

    // }); */

});