const express = require('express')
const session = require('express-session');
const flash = require('express-flash');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const bcrypt = require("bcrypt");

const app = express()

const loremIpsum = require('lorem-ipsum').loremIpsum;

const db = require('./db')
const port = 5000

app.use(express.urlencoded({extended : true}));
app.set('view engine', 'ejs');

app.use(
    session({
        secret: 'cool beans',
        resave: false,
        saveUninitialized: false,
    })
)

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
    console.log('serialize');
    done(null, user.uid)});
passport.deserializeUser((id, done) => {
    db.query("SELECT * FROM users where uid = $1;", [id], (err, results) => {
        console.log('deserialize');
        if(err){
            done(err);
        }
        console.log(id);
        return done(null, results.rows[0]);
    })
})
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
// HOME PAGE

app.get('/', (req, res) => {
    res.render('pages/index');
})

// REGISTER PAGE

app.get('/register', (req, res) => {
    res.render('pages/register');
})

// NEW POST PAGE

app.get('/newpost', (req, res) => {
    res.render('pages/post');
})
// LOGIN PAGE

app.get('/login',  (req, res) => {
    res.render('pages/login');
})

// DASHBOARD PAGE

app.get('/dashboard2', checkAuth, async (req, res) => {

    // Promise.all([
    //     db.pool.query("SELECT * from posts where user_id = $1 ORDER by date_created DESC;", [req.user.uid]),
    //     db.pool.query("select username from users u LEFT OUTER JOIN follow f ON follower = u.uid where followed = $1;", [req.user.uid]),
    //     db.pool.query("select username from users u LEFT OUTER JOIN follow f ON followed = u.uid where follower = $1;", [req.user.uid])
    // ]).then((result)=>{
    //     res.render('pages/dashboard', {user: req.user, posts: result[0].rows, followers: result[1].rows, following: result[2].rows});
    // }).catch(
    //     (err) => console.log(err)
    // );

    const runQueries = async () => {
        try{
            const [posts, followers, following] = await Promise.all([
                db.pool.query("SELECT * from posts where user_id = $1 ORDER by date_created DESC;", [req.user.uid]),
                db.pool.query("select username from users u LEFT OUTER JOIN follow f ON follower = u.uid where followed = $1;", [req.user.uid]),
                db.pool.query("select username from users u LEFT OUTER JOIN follow f ON followed = u.uid where follower = $1;", [req.user.uid])
            ]);

            console.log(posts,followers, following);
            return [posts, followers, following];
            } catch (err) {
                console.log(err);
            }
    }

    let [posts, followers, following] = await runQueries();
    res.render('pages/dashboard', {user: req.user, posts: posts.rows, followers: followers.rows, following: following.rows});

    
})

app.get('/dashboard', checkAuth, (req, res) => {
    db.query("SELECT * from posts where user_id = $1 ORDER by date_created DESC;", [req.user.uid], (err, result1) =>{
        
        db.query("select username from users u LEFT OUTER JOIN follow f ON follower = u.uid where followed = $1;", [req.user.uid], (err, result2) => {
            if(err) {throw err;}

            db.query("select username from users u LEFT OUTER JOIN follow f ON followed = u.uid where follower = $1;", [req.user.uid], (err, result3) => {
                if(err) {throw err;}
                res.render('pages/dashboard', {user: req.user, posts: result1.rows, followers: result2.rows, following: result3.rows});
            })
        })
    })
})

// USER PAGE

app.get('/user/:username', checkAuth, (req, res) => {
    db.query("SELECT * FROM users where username = $1;", [req.params.username], (err, result1) => {
        if (err) { throw err; }
        if (result1.rows.length < 1) { res.redirect('/dashboard'); }
        
        else {
            console.log(result1.rows);
            db.query("select username from users u LEFT OUTER JOIN follow f ON follower = u.uid where followed = $1;", [result1.rows[0].uid], (err, followResult) => {
                db.query("select username from users u LEFT OUTER JOIN follow f ON followed = u.uid where follower = $1;", [result1.rows[0].uid], (err, followingResult) => {
                    if(err) {throw err;}

                    db.query("SELECT * from posts where user_id = $1 ORDER by date_created DESC;", [result1.rows[0].uid], (err, result2) => {
                        if (err) { throw err; }
                        db.query("SELECT * FROM follow where follower = $1 and followed = $2", [req.user.uid, result1.rows[0].uid], (err, result3) => {
                            if (err) { throw err; }
                            if (result3.rows.length > 0) {
                                res.render('pages/user', { user: result1.rows[0], posts: result2.rows, follow: true, followers: followResult.rows, following: followingResult.rows});
                            } else {
                                res.render('pages/user', { user: result1.rows[0], posts: result2.rows, follow: false, followers: followResult.rows, following: followingResult.rows});
                            }
                        })

                    })

                })
            })


        }
    })
})

// LOGOUT PAGE

app.get('/logout', (req, res) => {
    res.render('pages/index');
})

// *** POST REQUESTS ***

// REGISTER USER WITH USERNAME AND PASSWORD

app.post('/register', async (req, res) => {
    const {username, email, password} = req.body;
    
    console.log(username, email, password);
    const hashPass = await bcrypt.hash(password, 10);

    db.query("select * from users where username = $1", [username], (err, result) => {
        
        if(err){
            console.log(err);
        }
        if(result.rows.length > 0){
            console.log('already registered');
            return res.render('pages/register', {message: "Username already registered"});
        } else {
            db.query("INSERT INTO users (username, password, email, email_verified, isprivate, date_created, last_login) VALUES ($1, $2, $3, $4, false, NOW(),NOW()) RETURNING uid, password;", [username, hashPass, email, false], (err, result) =>{
                if(err) {throw err;}
                console.log(result.rows);

                res.redirect('/login');
                
            })
        }
    })
})

// LOGIN AUTHENTICATION
app.post('/login', passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true
}))

// PUBLISH POST
app.post('/newpost', checkAuth, (req, res) => {
    const {title, content} = req.body;
    console.log(req.user);

    db.query("INSERT INTO posts (title, body, user_id, author, date_created) VALUES ($1, $2, $3, $4, NOW());", [title, content, req.user.uid, req.user.username], (err, result) => {
        if(err){throw err;}
        res.redirect('/dashboard');
    });
})

// FOLLOW USER

app.post('/follow', checkAuth, (req, res) => {
    console.log(req.body);
    db.query("SELECT * FROM users where username = $1;" , [req.body.follow], (err, res1) => {
        console.log(res1.rows[0]);
        if(err) {throw err;}

        db.query("SELECT * FROM follow where follower = $1 and followed = $2;", [req.user.uid, res1.rows[0].uid], (err, res2) => {
            if(err) {throw err;}
            console.log("select * from follow....", res2.rows);
            if(res2.rows.length == 0){
                db.query("INSERT INTO follow (follower, followed) VALUES($1, $2);", [req.user.uid, res1.rows[0].uid], (err, res3) => {
                    if(err) {throw err;}
                    res.redirect('/user/'+ req.body.follow);
                })
            } else {
               db.query("DELETE from follow where fid = $1;", [res2.rows[0].fid], (err, res4) => {
                   if(err) {throw err;}
                   res.redirect('/user/'+ req.body.follow);
               });
            }
        })
    })
    //db.query("INSERT INTO follow VALUES($1, $2);", [req.user.id, ])
})


app.post('/insertRandom', (req, res1) => {
    const randomNum = Math.floor(Math.random() * 1000);

    db.query('INSERT INTO users VALUES(default, $1, $2, $3, NOW(), NOW());', ['test'.concat(randomNum), 'test'.concat(randomNum).concat('@email.com'), true], (err, res) => {
        if(err){
            console.log(err);
        }
        res1.send("USER CREATED");
    });
})



function checkAuth(req, res, next){
    if (req.isAuthenticated()) {
        return next();
    }
    
    res.redirect("/login");
}

// for others to connect
// find ip addres (ipconfig) :port
// or (hostname) http://hostname:port
//app.listen(port, '0.0.0.0', () => console.log(`Example app listening at http://localhost:${port}`))
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))