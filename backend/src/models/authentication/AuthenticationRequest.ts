import { User } from "./User";
import { UserAuthenticationInfo } from "./UserAuthenticationInfo";
import { Request } from "express";
import Joi from 'joi'
import jwt, { JwtPayload, TokenExpiredError } from 'jsonwebtoken';
import { Logger } from '../../utils/Logger'
import { Database } from '../../database_pg';

//Jwtpayload default only has iat and exp. you need to specify a custom payload that can be recovered by jwt.verify
interface Payload extends JwtPayload {
    id: string;   
    admin: boolean;
}


// AuthenticationRequest: contains user info and password
/**
 * @brief This class handles the logic for token validity, authorization, and expiration. It is also important to note that this class 
 *        throws error to error check and halt code execution if the token is inalid.  MUST BE ENCLOSED IN TRY CATCH BLOCKS
 * 
 * @method isValidRequest: validates request body for /register and /authorize endpoints
 * @method isAdmin: returns admin status of bearer 
 * @method updateCalls: decrements number of API calls. deletes once token expires
 */
export class AuthenticationRequest {
    private token: string;
    private id: string;
    private admin: boolean;
    private db: Database;

    constructor(req: Request) {
        
        try {
            this.db = Database.getInstance();

            /*INSTANTIATE TOKEN*/
            const header = req.headers['x-authorization'];
            
            if(!header || Array.isArray(header)){
                console.log(header);
                throw new Error("403: Invalid authorization");
            }

            const parts = header.split(' ');
            
            //bearer has to preceed the token in order to render the token valid
            if (parts[0] != 'bearer'){
                throw new Error("403: Not an actual token")
            }

            //clean up quotations and 'bearer' from '"bearer <token>"'
            this.token = parts[1].replace(/^bearer\s*/i, '');

            /*INSTANTIATE PAYLOAD*/
            if (!process.env.JWT_KEY){
                throw new Error("403: JWT_KEY undefined OR has expired. Check your environment variables.");
            }
            
            try { //nested try catch because compiler doesn't know that only payload will be TokenExpiredError, cannot handle err in main trycatch
                const payload = jwt.verify(this.token, process.env.JWT_KEY) as Payload;

                this.id = payload.id;
                this.admin = payload.admin;

            } catch (err: any) {
                
                this.db.deleteToken(this.token);
                throw new Error("403: Token has expired.")
            }
            
        

        } catch (err: any) {
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

    public isAdmin() { return this.admin; }
    public getUserId() { return this.id; }

    public async updateCalls() { 
    
        try {

            const token_exists = await this.db.tokenExists(this.token);
            if (!token_exists){
                throw new Error("403: Token does does not exist, or has expired.");
            }

            let calls_remaining = await this.db.callsRemaining(this.token); 

            Logger.logInfo(`${calls_remaining} API interactions remaining for user ${this.id} 's token ${this.token}`);

            if(!calls_remaining){
                this.db.deleteToken(this.token); 
                throw new Error("403: You have reached the maximum API interactions. ");
            }

            await this.db.decrementCalls(this.token);

        } catch (err: any) {
            Logger.logError("Error updating token calls: ", err.message); 
            throw err; 

        }
        

    }


}