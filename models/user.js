/** User class for message.ly */
const bcrypt = require('bcrypt');
const { BCRYPT_WORK_FACTOR } = require('../config')
const ExpressError = require('../expressError');
const db = require("../db");




/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) {


        try {


        if(!username || !password || !first_name || !last_name || !phone){

            throw new ExpressError('All parts of the form are required', 404)

        }
        let today = new Date();
        

        const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)
        let result = await db.query(`
        INSERT INTO users (username, password, first_name, last_name, phone, join_at,last_login_at ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING username,password,first_name, last_name, phone `, [username,hashedPassword, first_name, last_name,phone, today, today])
        return result.rows[0];
        
    } catch (error) {
        console.log(error)

    }

   }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { 

  try {
      const results = await db.query(`
        SELECT *
        FROM users 
        WHERE username = $1`,[username]);
        const user = results.rows[0];

        if (results.rows[0].length === 0){
            throw new ExpressError("User not found", 400)

        }
      if(user){

      if( await bcrypt.compare(password, user.password)){

          return true
      }
      throw new ExpressError("Incorrect Password", 400)

      }
  
  } catch(e){

    // console.log(e)
  }
}


  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 

        const results = await db.query(`
        UPDATE users 
        SET last_login_at = current_timestamp WHERE username = $1 
        RETURNING username`,[username])   
        if (!results.rows[0]) {
              throw new ExpressError('User does not exist, not updated, error', 400)   
             }

          return results.rows[0];
    }



  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {

    const results = await db.query('SELECT username, first_name, last_name, phone FROM users')   
    const users = results.rows.map(r=> new User(r.username, r.first_name, r.last_name, r.phone));
    return results.rows;

   }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */



  static async get(username) {

    let result = await db.query("SELECT username, first_name, last_name, phone, join_at, last_login_at FROM users WHERE username = $1", [username]);

    if(result.rows.length === 0){
      console.log("Hello")
        throw new ExpressError('No user by that username exists', 404)

    }
    let r = result.rows[0];
    return r;

   }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {

      let result = await db.query("SELECT id, to_username, body, sent_at, read_at FROM messages WHERE from_username = $1", [username]);

    if(result.rows.length === 0){
        throw new ExpressError('No user by that username exists', 404)
    }
    return result.rows[0];


     }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {

    let result = await db.query("SELECT id, to_user, body, sent_at, read_at FROM messages WHERE to_username = $1", [username]);

    if(result.rows.length === 0){
        throw new ExpressError('No user by that username exists', 404)
    }
    return result.rows[0];
   }
}


module.exports = User;