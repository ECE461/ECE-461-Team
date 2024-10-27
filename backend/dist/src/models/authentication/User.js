"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
/* User: class with user name and isAdmin status and methods
 * @method: getJson
 */
class User {
    // constructor: initialize name and admin status
    constructor(name, isAdmin) {
        this.name = name;
        this.isAdmin = isAdmin;
    }
    // Return json object of user
    getJson() {
        return {
            Name: this.name,
            isAdmin: this.isAdmin
        };
    }
}
exports.User = User;
