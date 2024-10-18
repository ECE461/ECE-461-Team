export class PackageName {
    private name: string;
    
    constructor(name: string) {
        // TODO: check if we should trim this
        this.name = name.trim();
    }

    static isValidName(name: string): boolean {
        // Check that name is not just empty
        // Check name is <= 214 char, must have URL-safe characters

        return name.length > 0 && name.length <= 214 && /^[a-zA-Z0-9-_.@/]+$/.test(name);
    }

    matches(otherName: string): boolean {
        return otherName === this.name;
    }

    getName(): string {
        return this.name;
    }
}