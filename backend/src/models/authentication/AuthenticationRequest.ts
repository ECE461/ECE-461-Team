import { User } from "./User";
import { UserAuthenticationInfo } from "./UserAuthenticationInfo";
import { Request } from "express";
import Joi from 'joi'
import jwt, { JwtPayload, TokenExpiredError } from 'jsonwebtoken';
import { Logger } from '../../utils/Logger'
import Redis from 'ioredis'

//Jwtpayload default only has iat and exp. you need to specify a custom payload that can be recovered by jwt.verify
interface Payload extends JwtPayload {
    id: string;   
    admin: boolean;
}

// const redis: Redis = new Redis();

// AuthenticationRequest: contains user info and password
export class AuthenticationRequest {
    private token: string;
    private payload: Payload;

    constructor(req: Request) {
        
        try {

            /*INSTANTIATE TOKEN*/
            const header = req.headers['x-authorization'];
            
            if(!header || Array.isArray(header)){
                console.log(header);
                throw new Error("403: Invalid authorization");
            }

            const parts = header.split(' ');

            //bearer has to preceed the token in order to render the token valid
            if (parts[0] != '"bearer'){
                throw new Error("403: Not an actual token")
            }

            //clean up quotations and 'bearer' from '"bearer <token>"'
            this.token = parts[1].replace(/^"bearer\s*/i, '').replace(/"$/, '');

            /*INSTANTIATE PAYLOAD*/
            if (!process.env.JWT_KEY){
                throw new Error("403: JWT_KEY undefined OR has expired. Check your environment variables.");
            }

            this.payload = jwt.verify(this.token, process.env.JWT_KEY) as Payload;

        } catch (err: any) {

            if(err instanceof TokenExpiredError){
                throw new Error("403: Token has expired");
            }

            throw err;
        }

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

    public isAdmin() { return this.payload.isAdmin; }

    // public async incrementCalls(){
    //     //increment the number of api calls tied to this token 
    //     const calls = await redis.incr(`calls:${this.payload.id}`);
        
    //     if (calls > 1000){
    //         throw new Error("403: You have reached your API token limit. Your token has expired");
    //     }
    // }
}