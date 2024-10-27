"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationRequest = void 0;
const User_1 = require("./User");
const UserAuthenticationInfo_1 = require("./UserAuthenticationInfo");
// AuthenticationRequest: contains user info and password
class AuthenticationRequest {
    static isValidRequest(req) {
        // TODO: Add logic
        return true;
    }
    constructor(authReqObj) {
        // TODO: Checks for authReqObj or separate pre-function
        this.user = new User_1.User(authReqObj["User"]["name"], authReqObj["User"]["isAdmin"]);
        this.userAuthenticationInfo = new UserAuthenticationInfo_1.UserAuthenticationInfo(authReqObj["Secret"]["password"]);
    }
}
exports.AuthenticationRequest = AuthenticationRequest;
