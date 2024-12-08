import { URLHandler } from '../../src/utils/URLHandler';

describe('URLHandler Tests', () => {
    
    it ('should return an error when invalid URL provided', async () => {
        const invalidURL = 'invalidURL';
        expect(URLHandler.create(invalidURL)).toThrow();
    });

});