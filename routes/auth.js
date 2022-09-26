const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const User = require('../models/user')
const db = require('../db');
const {BCRYPT_WORK_FACTOR, SECRET_KEY, DB_URI} = require('../config')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const {ensureLoggedin, ensureCorrectUser } = require('../middleware/auth')





/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

 router.post('/login', async (req,res,next)=>{

    try {
        console.log(DB_URI)

        
        const {username,password} = req.body;
        if(!username || !password){
            throw new ExpressError('Missing Username or password', 400)

        }
        const results = await db.query(`
        SELECT username, password 
        FROM users 
        WHERE username = $1`,[username]);
        const user = results.rows[0];
        if(user){

            if(await bcrypt.compare(password, user.password)){
                const token = jwt.sign({username}, SECRET_KEY)
                User.updateLoginTimestamp(username);
    
                return res.json({msg:"logged in!", token})
            }

        }
        throw new ExpressError("User not found", 400)
        
    } catch (error) {

         return next(error);
        
    }
});




/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */


 router.post('/register', async (req,res,next)=>{
    try {
        const {username, password, first_name, last_name, phone } = req.body;

        
        console.log(username)
        let user = await User.register({username, password, first_name, last_name, phone});;
        // console.log("++++++++++++++++++++++++++++++++++++++++")
        // console.log(user)
        // console.log("++++++++++++++++++++++++++++++++++++++++")
        const token = jwt.sign({username}, SECRET_KEY)
        return res.json({token:token, username:user.username});
        
    } catch (error) {
        if(error.code === '23505'){
           return next(new ExpressError('Username is taken, choose another', 400))

        }
        return next(error);
    }

});


module.exports = router;
