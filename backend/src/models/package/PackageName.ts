import { Request } from 'express';

export class PackageName {
    private name: string;
    
    constructor(name: string) {
        // TODO: check if we should trim this
        this.name = name.trim();
    }

    static isValidName(name: string): boolean {
        // Check that name is not just empty
        // Check name is <= 214 char, must have only non-Unicode characters

        return name.length > 0 && name.length <= 214 && /^[\x20-\x7E]+$/.test(name);
    }

    static isValidGetByNameRequest(req: Request): boolean {
        // TODO: Add logic
        return true;
    }

    matches(otherName: string): boolean {
        return otherName === this.name;
    }

    getName(): string {
        return this.name;
    }
}