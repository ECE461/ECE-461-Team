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
}

// AuthenticationRequest: contains user info and password
export class AuthenticationRequest {
    private user: User;
    private userAuthenticationInfo: UserAuthenticationInfo;

    constructor(authReqObj: any) {
        // TODO: Checks for authReqObj or separate pre-function
        
        this.user = new User(authReqObj["User"]["name"], authReqObj["User"]["isAdmin"]);
        this.userAuthenticationInfo = new UserAuthenticationInfo(authReqObj["Secret"]["password"]);
    }

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
    static isValidToken(req: Request) {
        
        try {

            const header = req.headers['X-Authorization'];

            if(!header || Array.isArray(header)){
                throw new Error("403: Invalid ");
            }

            const parts = header.split(' ');

            //bearer has to preceed the token in order to render the token valid
            if (parts[0] != 'bearer'){
                throw new Error("403: Not an actual token")
            }
            
            //return string of authorization token
            return parts[1];

        } catch(err: any) {
            throw err;
        }
    }
    
    static decodeToken(token: string) { 
        try { 
            
            if (!process.env.JWT_KEY){
                throw new Error("403: JWT_KEY undefined OR has expired. Check your environment variables.");
            }

            //jwt.verify throws error if payload cannot be detected or token has expired. else returns payload
            const decode_payload = jwt.verify(token, process.env.JWT_KEY) as payload;

            return decode_payload; 
            
        } catch (err: any){
            throw new Error("403: Token has expired")
        }
    }

   /**
     * @brief a fat wrapper function for token validation
     */
    static AuthorizeToken(req: Request) { 
        try { 
            
            const payload = AuthenticationRequest.isValidToken(req); 


        } catch(err: any) {
            throw err; //chain the exceptions so they all show up in main 
        }
    }   
}