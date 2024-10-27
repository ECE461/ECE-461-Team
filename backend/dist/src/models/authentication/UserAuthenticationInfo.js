"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAuthenticationInfo = void 0;
/* UserAuthenticationInfo: contains user authentication info and methods
 * @method: getJson
 */
class UserAuthenticationInfo {
    // constructor: initialize password
    constructor(password) {
        this.password = password;
    }
    // Return json object of user authentication info
    getJson() {
        return {
            password: this.password
        };
    }
}
exports.UserAuthenticationInfo = UserAuthenticationInfo;
