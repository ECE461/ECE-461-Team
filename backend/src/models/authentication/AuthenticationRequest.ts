import { User } from "./User";
import { UserAuthenticationInfo } from "./UserAuthenticationInfo";
import { Request } from "express";

// AuthenticationRequest: contains user info and password
export class AuthenticationRequest {
    private user: User;
    private userAuthenticationInfo: UserAuthenticationInfo;

    static isValidRequest(req: Request) : boolean {
        // TODO: Add logic
        return true;
    }

    constructor(authReqObj: any) {
        // TODO: Checks for authReqObj or separate pre-function
        
        this.user = new User(authReqObj["User"]["name"], authReqObj["User"]["isAdmin"]);
        this.userAuthenticationInfo = new UserAuthenticationInfo(authReqObj["Secret"]["password"]);
    }
}