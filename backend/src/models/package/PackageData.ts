import Joi from 'joi';

export class PackageData {
    private content; // Zipped content converted to base-64
    private JSProgram; // TODO: Extension

    private static packageUploadSchema = Joi.object({
        Content: Joi.string(),
        URL: Joi.string().uri(),
        JSProgram: Joi.string().optional(),
    }).xor('Content', 'URL');

    /* Private Constructor : (only can be used in create method)
     * - Uses create method becasue setContentFromURL is async 
     *
     * @param source: string - initially "" to initialize "content", "content" will be set in create method
     * @param jsProgram: string - jsProgram for sensitive data
     */
    private constructor(source: string, jsProgram: string) {
        //TODO: might change this to take in an object?? to check that Content/URL not set at same time
        this.JSProgram = jsProgram;
        this.content = source;
    }

    /* create : Static method to create an instance
     * - Uses create method becasue setContentFromURL is async
     * 
     * @param source: string - URL or base-64 encoded content
     * @param jsProgram: string - jsProgram for sensitive data
     * @returns Promise
     */
    static async create(source: string, jsProgram: string) {
        const instance = new PackageData("", jsProgram);
        if (instance.isValidURL(source)) {
            await instance.setContentFromURL(source);
        } else {
            instance.content = source;
        }
        return instance;
    }

    // isValidURL : Checks if URL is valid
    // @param url: string - URL to check
    private isValidURL(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    }

    static isValidUpdateRequest(reqBody: any) {
        const { error } = PackageData.packageUploadSchema.validate(reqBody);
        if (error) {
            return false;
        }
        return true;
    }

    /* setContentFromURL : sets content from URL by getting 
    */
    private async setContentFromURL(url: string) {
        // TODO: need to get zipped content (without .git folder) from github or wherever and convert to base-64
        this.content = url;
    }

    getJson() {
        // API never sends URL back as response
        return {
            Content: this.content,
            JSProgram: this.JSProgram // TODO: might not need to include if empty string
        }
    }
}