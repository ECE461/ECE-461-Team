import { User } from "./User";
import { UserAuthenticationInfo } from "./UserAuthenticationInfo";
import { Request } from "express";
import Joi from 'joi'
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Logger } from '../../utils/Logger'


//Jwtpayload default only has iat and exp. you need to specify a custom payload that can be recovered by jwt.verify
interface payload extends JwtPayload {
    id: string;   
    admin: boolean;
    calls: number;
}

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

    /**
     * @brief validates the token formatting and expiration
     */
    static isValidToken(req: Request) : boolean {
        
        try {

            const header = req.headers['X-Authorization'];

            if(!header || Array.isArray(header)){
                throw new Error("Invalid ");
            }

            const parts = header.split(' ');

            //bearer has to preceed the token in order to render the token valid
            if (parts[0] != 'bearer'){
                throw new Error("Not an actual token")
            }
            
            //actually validate the token to see if it contains a payload
            if (!process.env.JWT_KEY){
                throw new Error("JWT_KEY undefined OR has expired. Check your environment variables.");
            }

            //jwt.verify throws error if payload cannot be detected or token has expired. else returns payload
            const token = jwt.verify(parts[1], process.env.JWT_KEY) as payload;

            if (!token.admin){
                throw new Error("You are not an admin. You do not have permission to register a user.")
            }

            //TODO HANDLE TOKEN REFRESH LOGIC

            if (!token.calls){
                throw new Error("You have reached the 1000 api call limit. Token has expired");
            }
            
            return true;
        } catch(err: any) {
            Logger.logDebug("Error: " + err.message());
            return false; 
        }
    }



    constructor(authReqObj: any) {
        // TODO: Checks for authReqObj or separate pre-function
        
        this.user = new User(authReqObj["User"]["name"], authReqObj["User"]["isAdmin"]);
        this.userAuthenticationInfo = new UserAuthenticationInfo(authReqObj["Secret"]["password"]);
    }
}