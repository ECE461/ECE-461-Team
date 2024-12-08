import { URLHandler } from '../../src/utils/URLHandler';

describe('URLHandler Tests', () => {

    describe('create()', () => {
        it('should return a new URLHandler when given GitHub URL', async () => {
            const urlHandler = await URLHandler.create('https://github.com/cloudinary/cloudinary_npm');
            expect(urlHandler).toBeInstanceOf(URLHandler);
            expect(urlHandler.url).toBe('https://github.com/cloudinary/cloudinary_npm');
        });

        it('should return a new URLHandler when given NPM URL', async () => {
            const urlHandler = await URLHandler.create('https://www.npmjs.com/package/cloudinary');
            expect(urlHandler).toBeInstanceOf(URLHandler);
            expect(urlHandler.url).toBe('https://www.npmjs.com/package/cloudinary');
            expect(urlHandler.githubURL).toBe('https://github.com/cloudinary/cloudinary_npm');
        });

        it('should return an error when given an invalid URL', async () => {
            try {
                await URLHandler.create('invalidurl');
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect((error as Error).message).toBe('Invalid URL');
            }
        });

        it('should return an error when given a URL that does not exist', async () => {
            try {
                await URLHandler.create('https://www.invalidurl.com');
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect((error as Error).message).toContain('URL does not exist');
            }
        });

        it('should return an error when given a URL that is not from NPM or GitHub', async () => {
            try {
                await URLHandler.create('https://www.google.com');
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect((error as Error).message).toContain('GitHub URL not found');
            }
        });

        it('should properly set the owner and repository values when using GitHub URL', async () => {
            const urlHandler = await URLHandler.create('https://github.com/cloudinary/cloudinary_npm');
            expect(urlHandler.getOwnerName()).toBe('cloudinary');
            expect(urlHandler.getRepoName()).toBe('cloudinary_npm');
        });
    });

    describe('standardizeGitHubURL()', () => {
        it('should return the standardized GitHub URL when specific branch given', () => {
            const githubURL = 'https://github.com/cloudinary/cloudinary_npm/tree/add-getting-started-sample';
            const expectedStandardizedURL = 'https://github.com/cloudinary/cloudinary_npm';
            expect(URLHandler.standardizeGitHubURL(githubURL)).toBe(expectedStandardizedURL);
        });

        it('should return the standardized GitHub URL when tags given', () => {
            const githubURL = 'https://github.com/cloudinary/cloudinary_npm/releases/tag/2.5.1';
            const expectedStandardizedURL = 'https://github.com/cloudinary/cloudinary_npm';
            expect(URLHandler.standardizeGitHubURL(githubURL)).toBe(expectedStandardizedURL);
        });

        it('should return the same URL if basic GitHub URL given', () => {
            const githubURL = 'https://github.com/cloudinary/cloudinary_npm';
            expect(URLHandler.standardizeGitHubURL(githubURL)).toBe(githubURL);
        });

        it('should throw an error if the URL is not a GitHub URL', () => {
            const invalidURL = 'https://www.google.com';
            try {
                URLHandler.standardizeGitHubURL(invalidURL);
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect((error as Error).message).toBe("Invalid GitHub URL format");
            }
        });
    });

    describe('isValidURL()', () => {
        it('should return true if the URL is valid', () => {
            const validURL = 'https://www.google.com';
            expect(URLHandler.isValidURL(validURL)).toBe(true);
        });

        it('should return false if the URL is invalid', () => {
            const invalidURL = 'invalidurl';
            expect(URLHandler.isValidURL(invalidURL)).toBe(false);
        });
    });
    
    describe('checkUrlExists()', () => {
        it('should return true if the URL exists', async () => {
            const validURL = 'https://www.google.com';
            expect(await URLHandler.checkUrlExists(validURL)).toBe(true);
        });

        it('should return false if the URL does not exist', async () => {
            const invalidURL = 'https://www.invalidurl.com';
            expect(await URLHandler.checkUrlExists(invalidURL)).toBe(false);
        });
    });

    describe('convertGithubURLToHttps()', () => {
        it('should return the HTTPS URL if the URL is a GitHub URL', () => {
            const githubURL = 'git://github.com/username/repo.git';
            const expectedHttpsURL = 'https://github.com/username/repo';
            expect(URLHandler.convertGithubURLToHttps(githubURL)).toBe(expectedHttpsURL);
        });

        it('should return the same URL if the URL is not a GitHub URL', () => {
            const invalidURL = 'https://www.google.com';
            expect(URLHandler.convertGithubURLToHttps(invalidURL)).toBe(invalidURL);
        });
    });

    describe('getGithubURLFromNpmURL()', () => {
        it('should return the GitHub URL if the URL is an NPM URL', async () => {
            const npmURL = 'https://www.npmjs.com/package/cloudinary';
            const expectedGithubURL = 'https://github.com/cloudinary/cloudinary_npm';

            const gitUrl = await URLHandler.getGithubURLFromNpmURL(npmURL);
            expect(gitUrl).toBe(expectedGithubURL);
        });

        it('should return null if the URL is not from NPM', async () => {
            const invalidURL = 'https://www.google.com';
            const gitUrl = await URLHandler.getGithubURLFromNpmURL(invalidURL);
            expect(gitUrl).toBe(null);
        });
    });

    describe('cleanURLIfCredentials()', () => {
        it('should return the URL without credentials if the URL contains credentials', () => {
            const urlWithCredentials = 'https://username@github.com/cloudinary/cloudinary_npm'
            const expectedCleanURL = 'https://github.com/cloudinary/cloudinary_npm';
            expect(URLHandler.cleanURLIfCredentials(urlWithCredentials)).toBe(expectedCleanURL);
        });

        it('should return the same URL if the URL does not contain credentials', () => {
            const urlWithoutCredentials = 'https://github.com/cloudinary/cloudinary_npm';
            expect(URLHandler.cleanURLIfCredentials(urlWithoutCredentials)).toBe(urlWithoutCredentials);
        });

        it('should return the same URL if the URL is invalid', () => {
            const invalidURL = 'invalidurl';
            expect(URLHandler.cleanURLIfCredentials(invalidURL)).toBe(invalidURL);
        });

    });
});