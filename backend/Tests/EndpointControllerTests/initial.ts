import axios, { AxiosResponse } from 'axios';
import { PackageQuery } from '../../src/models/package/PackageQuery';
import { IPackageMetadata } from '../../src/models/package/PackageMetadata';

async function testGetPackagesByQuery(query: PackageQuery, offset: number = 0) {
    try {
        const BASE_API = 'http://localhost:3000/api/v1';
        const queryArray = [query.getJson()];
        const response: AxiosResponse<IPackageMetadata[]> = await axios.post(BASE_API + '/packages', queryArray, { params: { offset } });
        return response.data;
    } catch (error) {
        console.error('Error fetching patches: ', error);
    }
}

testGetPackagesByQuery(new PackageQuery('package-name', '1.0.0'))
  .then(packages => {
    console.log(packages);
  })
  .catch(error => console.error(error.message));