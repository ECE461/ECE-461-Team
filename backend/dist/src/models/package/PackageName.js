"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageName = void 0;
class PackageName {
    constructor(name) {
        // TODO: check if we should trim this
        this.name = name.trim();
    }
    static isValidName(name) {
        // Check that name is not just empty
        // Check name is <= 214 char, must have URL-safe characters
        return name.length > 0 && name.length <= 214 && /^[a-zA-Z0-9-_.@/]+$/.test(name);
    }
    static isValidGetByNameRequest(req) {
        // TODO: Add logic
        return true;
    }
    matches(otherName) {
        return otherName === this.name;
    }
    getName() {
        return this.name;
    }
}
exports.PackageName = PackageName;
