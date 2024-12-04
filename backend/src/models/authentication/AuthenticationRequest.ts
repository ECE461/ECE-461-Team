import { User } from "./User";
import { UserAuthenticationInfo } from "./UserAuthenticationInfo";
import { Request } from "express";
import Joi from 'joi'

// AuthenticationRequest: contains user info and password
export class AuthenticationRequest {
    private user: User;
    private userAuthenticationInfo: UserAuthenticationInfo;

    static isValidRequest(req: Request) : boolean {
    
        const request_body = Joi.object({

            User: Joi.object({
                name: Joi.string().required(),
                isAdmin: Joi.boolean().required(),
            }).required(),

            Secret: Joi.object({
                password: Joi.string().min(8).required(),
            }).required(),

        });

        const {error} = request_body.validate(req.body)

        if(error){
            return false; //error message is handled in the command controller
        }

        return true;
    }

    constructor(authReqObj: any) {
        // TODO: Checks for authReqObj or separate pre-function
        
        this.user = new User(authReqObj["User"]["name"], authReqObj["User"]["isAdmin"]);
        this.userAuthenticationInfo = new UserAuthenticationInfo(authReqObj["Secret"]["password"]);
    }
}