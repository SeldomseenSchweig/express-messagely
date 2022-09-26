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

        const {username, password, first_name, last_name, phone } = req.body;
        if(!username || !password || !first_name || !last_name || !phone){
            throw new ExpressError('Al parts of the form are required', 404)

        }
        const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)
        let result = await db.query(`
        INSERT INTO users (username, password, first_name, last_name, phone ) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING username`, [username,hashedPassword, first_name, last_name, phone ])

        return res.json(result.rows[0]);
        
    } catch (error) {
        if(error.code === '23505'){
           return next(new ExpressError('Username is taken, choose another', 400))

        }
        next(error);
    }

   }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { 

  const {username,password} = req.body;

  try {
      const results = await db.query(`
        SELECT username, password 
        FROM users 
        WHERE username = $1`,[username]);
        const user = results.rows[0];
      if(user){

      if(await bcrypt.compare(password, user.password)){
          // const token = jwt.sign({username}, SECRET_KEY)

          return true
      }
            throw new ExpressError("Incorrect Password", 400)

      }
      throw new ExpressError("User not found", 400)
  } catch(e){

    return next(e)
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

          return result.rows[0];
    }



  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {

    const results = await db.query('SELECT username, first_name, last_name, phone  age FROM users')   
    // const users = results.rows.map(r=> new User(r.id, r.name, r.age));
    return resutls.rows;

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

    let result = await db.query("SELECT username FROM users WHERE username = $1", [username]);

    if(result.rows.length === 0){
        throw new ExpressError('No user by that username exists', 404)
    }
    return result.rows[0];

   }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {

      let result = await db.query("SELECT username FROM users WHERE username = $1", [username]);

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

  static async messagesTo(username) { }
}


module.exports = User;