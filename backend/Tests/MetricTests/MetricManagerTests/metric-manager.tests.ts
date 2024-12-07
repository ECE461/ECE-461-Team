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

    it ('should return 0.5 when all subscores are 0.5', async () => {
      // have to mock dependency getJson as well
      jest.spyOn(dependency, 'getPackageJson').mockResolvedValue({
        "name": "my-package",
        "version": "1.0.0",
        "dependencies": {
          "express": "^4.17.1",
          "lodash": "^4.17.21"
        }
      });

      jest.spyOn(BusFactor.prototype, 'calculateBusFactor').mockResolvedValue(0.5);
      jest.spyOn(Correctness.prototype, 'getCorrectnessScore').mockResolvedValue(0.5);
      jest.spyOn(dependency.DependencyMetric.prototype, 'getPackageScore').mockReturnValue(0.5);
      jest.spyOn(License.prototype, 'getRepoLicense').mockResolvedValue(1); // License is only 1 or 0
      jest.spyOn(Maintainer.prototype, 'getMaintainerScore').mockResolvedValue(0.5);
      jest.spyOn(PullRequest.prototype, 'getPullRequest').mockResolvedValue(0.5);
      jest.spyOn(RampUp.prototype, 'getRampUpScore').mockResolvedValue(0.5);

      const manager = new MetricManager('cloudinary/cloudinary_npm');
      const metrics = await manager.getMetrics();
      expect(metrics.netScore).toBe(0.5);
    });

});