const LocalStrategy = require('passport-local').Strategy;
const db = require('./db')

const bcrypt = require("bcrypt");

function initialize(passport) {
    passport.use(new LocalStrategy(
        (username, password, done) => {
            console.log("Authenticating user...",username,password);
            db.query("SELECT * FROM users WHERE username = $1;", [username], (err, result) => {
                if(err){
                    throw err;
                }
        
                if(result.rows.length > 0){
                    const user = result.rows[0];
                    console.log(user);
        
                    bcrypt.compare(password, user.password, (err, match) => {
                        if(err){
                            console.log(err);
                        }
                        if(match){
                            return done(null, user);
                        } else {
                            return done(null, false, {message: "Password is incorrect"});
                        }
                    })
                } else {
        
                    return done(null, false, {
                        message: "No user with that username"
                    });
                }
        
            })
        }
    ))
    
    passport.serializeUser((user, done) => {
        //console.log('serialize');
        done(null, user.uid)});
    passport.deserializeUser((id, done) => {
        db.query("SELECT * FROM users where uid = $1;", [id], (err, results) => {
            //console.log('deserialize');
            if(err){
                done(err);
            }
            //console.log(id);
            return done(null, results.rows[0]);
        })
    })
}

module.exports = initialize;