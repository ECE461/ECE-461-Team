import axios from 'axios';
import { Logger } from './Logger';

/**
 * @class URLHandler
 * @description 
 * The URLHandler class is responsible for handling URL-related operations,
 * such as validating URLs, checking if a URL exists, extracting GitHub repository
 * URLs from npm package URLs, and constructing base API URLs for GitHub repositories.
 *
 * This class provides methods to interact with URLs and perform various operations
 * like setting repository URLs, getting base API URLs, and extracting repository names.
 *
 * @example
 * // Creating an instance of URLHandler
 * const urlHandler = new URLHandler('https://github.com/user/repo');
 * 
 * // Setting the repository URL
 * await urlHandler.setRepoURL();
 * 
 * // Getting the repository URL
 * const repoURL = urlHandler.getRepoURL();
 * 
 * // Getting the base API URL
 * const baseAPI = urlHandler.getBaseAPI();
 *
 * @param {string} url - The URL to be handled.
 *
 * @method getRepoURL(): string
 * Returns the GitHub repository URL if set, otherwise an empty string.
 *
 * @method getBaseAPI(): string
 * Returns the base API URL for the GitHub repository if set, otherwise an empty string.
 * 
 * @method getURL(): string
 * Returns the original URL.
 * 
 * @method setRepoURL(): Promise<void>
 * Sets the GitHub repository URL and base API URL if the original URL is valid and exists.
 * 
 * @method getRepoName(): string
 * Extracts and returns the repository name from the URL.
 * 
 * @method static isValidURL(url: string): boolean
 * Checks if the provided URL is valid.
 * 
 * @method static checkUrlExists(url: string): Promise<boolean>
 * Checks if the provided URL exists by making a HEAD request.
 * 
 * @method static convertGithubURLToHttps(url: string): string
 * 
 * @method static getGithubURLFromNpmURL(url: string): Promise<string | null>
 * Extracts and returns the GitHub repository URL from an npm package URL.
 */
export class URLHandler {
  url: string; // the provided URL
  githubURL: string | null = null; // the GitHub repository URL
  baseAPI: string | null = null;  // the base API URL
  private constructor(url: string) {
    if(url.includes('git')) {
      // Need to clean up before isValidURL check in create() method
      let cleanedUrl = URLHandler.convertGithubURLToHttps(url);
      this.url = cleanedUrl;
    }
    else{
      this.url = url;
    }
  }

  /**
   * @method getRepoURL
   * @return {string} The GitHub repository URL if set, otherwise an empty string.
   * @description
   * This method returns the GitHub repository URL if set, otherwise an empty string.
   */
  public getRepoURL(): string {
    if (this.githubURL === null) {
      return "";
    }
    return this.githubURL;
  }


  /**
   * @method getBaseAPI
   * @return {string} The base API URL for the GitHub repository if set, otherwise an empty string.
   * @description
   * This method returns the base API URL for the GitHub repository if set, otherwise an empty string.
   */
  public getBaseAPI(): string {
    if (this.baseAPI === null) {
      return "";
    }
    return this.baseAPI;
  }

  /**
   * @method getURL
   * @return {string} The original URL.
   * @description
   * This method returns the original URL.
   */
  public getURL(): string {
    return this.url;
  }

  /**
   * @method setRepoURL
   * @return {Promise<void>}
   * @description
   * This method sets the GitHub repository URL and base API URL if the original URL is valid and exists.
   */
  static async create(url: string): Promise<URLHandler> {
    // Create instance + clean up git url
    const instance = new URLHandler(url);

    // Check if URL is valid
    if (URLHandler.isValidURL(instance.url)) {
      // Check if URL exists - make fake call to it
      const exists = await URLHandler.checkUrlExists(instance.url);  // check URL is valid and exists
      if (!exists) {
        throw new Error('URL does not exist: ' + instance.url);
      }

      // Set github URL
      if (instance.url.startsWith('https://www.npmjs.com/package/')) {  // convert npm URL to github URL
        instance.githubURL = await URLHandler.getGithubURLFromNpmURL(instance.url);
      }
      else if (instance.url.startsWith('https://github.com/')) {  // set github URL directly
        instance.githubURL = instance.url;
      }

      Logger.logInfo('Set githubURL: ' + instance.githubURL);

      // Set base API URL is guthubURL found
      if(instance.githubURL !== null) {  // set base API URL if github URL is set
        const urlParts = instance.githubURL.split('github.com/')[1].split('/');  // divide the github URL into parts
        const repoAuthority = urlParts[0];  // can be either the owner or the organization of the repo
        const repoName = urlParts[1];  // name of the repository
        instance.baseAPI = `https://api.github.com/repos/${encodeURIComponent(repoAuthority)}/${encodeURIComponent(repoName)}`;  // base API URL
      }
      else {
        throw new Error('GitHub URL not found');
      }
      return instance;
    } else {
      throw new Error('Invalid URL');
    }
  }

  static standardizeGitHubURL(inputUrl: string): string {
    const regexTree = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)$/;  // For /tree/{branch}
    const regexRelease = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/releases\/tag\/([^/]+)$/;  // For /releases/tag/{version}
    const regexSimple = /^https:\/\/github\.com\/([^/]+)\/([^/]+)$/;  // For basic owner/repo format
  
    let match;
  
    // Check if the URL matches the /tree/{branch} format
    if ((match = inputUrl.match(regexTree))) {
      const [, owner, repo] = match;
      return `https://github.com/${owner}/${repo}`;
    }
  
    // Check if the URL matches the /releases/tag/{version} format
    if ((match = inputUrl.match(regexRelease))) {
      const [, owner, repo] = match;
      return `https://github.com/${owner}/${repo}`;
    }
  
    // Check if the URL is already in the owner/repo format
    if ((match = inputUrl.match(regexSimple))) {
      const [, owner, repo] = match;
      return `https://github.com/${owner}/${repo}`;
    }
  
    // If the URL doesn't match any of the known formats, return an error or the original URL
    throw new Error("Invalid GitHub URL format");
  }
  
  /**
   * @method getRepoName
   * @return {string} The repository name extracted from the URL.
   * @description
   * This method extracts and returns the repository name from the URL.
   * If the URL does not contain a repository name, it returns an empty string.
   */
    public getRepoName(): string {
      try {
        const parsedUrl = new URL(this.url); // Parse the URL
        const pathParts = parsedUrl.pathname.split('/').filter(part => part.length > 0); // Split the path into segments

        if (pathParts.length >= 2) {
            return pathParts[1]; // Second segment is the repository name
        }
      } catch (error) {
        Logger.logDebug(`Invalid URL or format: ${this.url} ${error}`);
    }
    return "";
  }

   /**
   * @method getOwnerName
   * @return {string} The repository owner extracted from the github repository URL.
   * @description
   * This method extracts and returns the repository owner from the github repository URL.
   * If the URL does not contain a repository owner, it returns an empty string.
   */

  public getOwnerName(): string {
      try {
          const parsedUrl = new URL(this.url); // Parse the URL
          const pathParts = parsedUrl.pathname.split('/').filter(part => part.length > 0); // Split the path into segments

          if (pathParts.length >= 2) {
            return pathParts[0]; // First segment is the owner name
          }
      } catch (error) {
          Logger.logDebug(`Invalid URL or format: ${this.url} ${error}`);
      }
      return "";
  }


  /**
   * @method isValidURL
   * @param {string} url - The URL to be validated.
   * @return {boolean} True if the URL is valid, otherwise false.
   * @description
   * This static method checks if the provided URL is valid.
   */
  public static isValidURL(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch (error) {
        Logger.logDebug('Invalid URL format:' + error);
        return false;
    }
  }

  /**
   * @method checkUrlExists
   * @param {string} url - The URL to be checked.
   * @return {Promise<boolean>} True if the URL exists, otherwise false.
   * @description
   * This static method checks if the provided URL exists by making a HEAD request.
   */
  public static async checkUrlExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      Logger.logInfo('Error checking URL:' + error);
      return false;
    }
  }
  
  /**
   * @method staticGithubURLToHttps
   * @param {string} url - The URL to be converted
   * @return {Promise<boolean>} The https formatted version of the URL.
   * @description
   * This static method converts the provided GitHub URL to an https formatted URL.
   */
public static convertGithubURLToHttps(url: string): string {
  let httpsUrl = url.replace(/^git\+/, '').replace(/\.git$/, '');

  if (httpsUrl.startsWith('git://')) {
    httpsUrl = httpsUrl.replace('git://', 'https://');
  } else if (httpsUrl.startsWith('git@')) {
    httpsUrl = httpsUrl.replace('git@', 'https://').replace(':', '/');
  }

  return httpsUrl;
}

  /**
   * @method getGithubURLFromNpmURL
   * @param {string} url - The npm package URL.
   * @return {Promise<string | null>} The GitHub repository URL if found, otherwise null.
   * @description
   * This static method extracts and returns the GitHub repository URL from an npm package URL.
   * If the GitHub repository URL cannot be found, it returns null.
   */
public static async getGithubURLFromNpmURL(url: string): Promise<string | null> {
  // Get github repository URL from npm package URL
  try {
      Logger.logInfo("Getting github URL from npm package URL:" + url);
      // Extract package name from npm URL
      const regex = /\/package\/([^\/]+)/;
      const match = url.match(regex);
      const packageName = match ? match[1] : '';
      Logger.logDebug("Package name:" + packageName);

      // Check package.json of npmjs package from registry.npmjs.org
      const response = await axios.get(`https://registry.npmjs.org/${packageName}`);
      
      // Check that repository is a git repository
      if (response.data.repository?.type !== 'git') {
        return null;
      }

      // Convert git repository URL to https format
      let urlG = '';
      if (response.data.repository?.homepage && response.data.repository?.homepage.includes('github.com')) {
          urlG = URLHandler.convertGithubURLToHttps(response.data.repository?.homepage);
      }
      else if (response.data.repository?.url && response.data.repository?.url.includes('github.com')) {
          urlG = URLHandler.convertGithubURLToHttps(response.data.repository?.url);
      }
      else {
          throw new Error("400: No url found in the uploaded package's package.json");
      }
    
      Logger.logDebug("Github URL:" + urlG);
      const githubURL = URLHandler.convertGithubURLToHttps(urlG);

      
      // Return null if no github URL found
      if (githubURL == "") {
        return null;
      }

      return githubURL;
  } catch (error) {
      Logger.logError('Error getting github URL from npm package:', error);
  }
  return null;
}

static cleanURLIfCredentials(input: string): string {
  try {
      // Parse the input as a URL
      const url = new URL(input);

      // Check if the URL has credentials (username is present)
      if (url.username) {
          Logger.logInfo(`Found credentials in URL: ${url.username}`);

          // Remove credentials by clearing username and password
          url.username = '';
          url.password = '';

          // Return the cleaned URL
          return url.toString();
      }

      // No credentials found, return the original URL
      return input;
  } catch (error) {
      // If input is not a valid URL, return it unchanged
      Logger.logError("Invalid URL provided:", error);
      return input;
  }
}

}

