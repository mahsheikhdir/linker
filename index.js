const express = require('express')
const session = require('express-session');
const flash = require('express-flash');
const bcrypt = require("bcrypt");
const passport = require('passport');
const configurePassport = require('./passportConfig');
const marked = require('marked');
const slugify = require('slugify');
const methodOverride = require('method-override');
const favicon = require('express-favicon');

const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const domPurify = createDOMPurify(new JSDOM().window);

const app = express()


const db = require('./db')
const queries = require('./queries');
const port = process.env.PORT || 5000

app.use(express.urlencoded({extended : true}));
app.set('view engine', 'ejs');

app.use(methodOverride('_method'));

app.use(
    session({
        secret: 'cool beans',
        resave: false,
        saveUninitialized: false,
    })
)

configurePassport(passport);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Serve Static files

app.use(express.static('public'));

app.use(favicon(__dirname+'/public/favicon.ico'))

app.use(function(req, res, next) {
    res.locals.loggedIn_user = req.user;
    next();
})

// HOME PAGE
app.get('/', async (req, res) => {
    try {
        const public_posts = await queries.getPublicPosts();
        res.render('pages/index', {posts: public_posts.rows});
    } catch (err) {
        console.log(err);
    }
})

app.post('/', (req, res) => {
    res.redirect('/');
} )

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
app.get('/dashboard', checkAuth, async (req, res) => {
    try {
        const [posts, followers, following] = await Promise.all([
            queries.allPosts(req.user.uid),
            queries.allFollowers(req.user.uid),
            queries.allFollowing(req.user.uid)
        ]);
        res.render('pages/dashboard', {user: req.user, posts: posts.rows, followers: followers.rows, following: following.rows});

    } catch (err) {
        console.log(err);
    }

})

app.get('/edit/:id', checkAuth, async (req, res) => {
    try {
        const editPost = await queries.getSinglePost(req.params.id);
        console.log(editPost.rows[0]);
        res.render('pages/edit', {post : editPost.rows[0]});
    } catch (err) {
        console.log(err);
    }
})

app.get('/article/:slug', checkAuth, async (req, res) => {
    console.log("SLGUWEFJ WE");
    try {
        const article = await queries.getSinglePost(req.params.slug);
        
        res.render('pages/article', {post: article.rows[0]});
    } catch (err) {
        console.log(err);
    }
})
// USER PAGE
app.get('/user/:username', checkAuth, async (req, res) => {
    try {
        const user = await queries.selectUserFromUsername(req.params.username);
        
        if(user.rows < 1) {
            res.redirect('/dashboard');
        } else {
            let [followers, following, posts, isFollowing] = await Promise.all([
                queries.allFollowers(user.rows[0].uid),
                queries.allFollowing(user.rows[0].uid),
                queries.allPosts(user.rows[0].uid),
                queries.isUserFollowing(req.user.uid, user.rows[0].uid),
            ]);

            if(isFollowing.rows.length > 0){
                res.render('pages/user', { user: user.rows[0], posts: posts.rows, follow: true, followers: followers.rows, following: following.rows});
            } else {
                res.render('pages/user', { user: user.rows[0], posts: posts.rows, follow: false, followers: followers.rows, following: following.rows});
            }

        }
    } catch (err) {
        console.log(err);
    }
})

// LOGOUT PAGE
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
})

app.delete('/article/:id', async (req, res) => {
    try {
        console.log("DELETING POST", req.params.id);
        const deleteArticle = await queries.deleteArticle(req.params.id);
        res.redirect('/');
    } catch (err) {
        console.log(err);
    }
})
// *** POST REQUESTS ***

// REGISTER USER WITH USERNAME AND PASSWORD
app.post('/register', async (req, res) => {
    const {username, email, password} = req.body;
    
    try {
        console.log(username, email, password);
        const hashPass = await bcrypt.hash(password, 10);

    
        const user = await queries.selectUserFromUsername(username);

        if(user.rows.length > 0){
            return res.render('pages/register', {message: "Username already registered"});
        } else {
            const insertUser = await queries.newUser(username, hashPass, email);
            res.redirect('/login');
        }
    } catch (err) {
        console.log(err);
    }
})


// LOGIN AUTHENTICATION
app.post('/login', passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true
}))

app.put('/edit/:id', checkAuth, async (req, res) => {
    const {title, description, content, public} = req.body;
    let is_private;

    if(public == "on"){
        is_private = true;
    } else {
        is_private = false;
    }
    
    let markedContent = marked(content);
    let sanitizedContent = domPurify.sanitize(markedContent);

    let slug = slugify(title, {lower: true, strict: true});

    console.log(req.body, public, is_private);
    try {
        const post = await queries.updatePost(req.params.id, title, content, description, sanitizedContent, slug);
        res.redirect('/dashboard');
    } catch (err) {
        console.log(err);
    }
})
// PUBLISH POST
app.post('/newpost', checkAuth, async (req, res) => {
    const {title, description, content, public} = req.body;
    let is_private;

    if(public == "on"){
        is_private = true;
    } else {
        is_private = false;
    }
    
    let markedContent = marked(content);
    let sanitizedContent = domPurify.sanitize(markedContent);

    let slug = slugify(title, {lower: true, strict: true});

    console.log(req.body, public, is_private);
    try {
        const post = await queries.newPost(title, content, description, sanitizedContent, req.user.uid, req.user.username, is_private, slug);
        res.redirect('/dashboard');
    } catch (err) {
        console.log(err);
    }
})

//CHANGE EMAIL
app.post("/uemail", checkAuth, async (req, res) => {
    const email = req.body.email;

    const uemail = await queries.updateEmail(req.user.uid, email);

    res.redirect("/dashboard");
})

//CHANGE BIO
app.post("/ubio", checkAuth, async (req, res) => {
    const bio = req.body.bio;

    const uemail = await queries.updateBio(req.user.uid, bio);

    res.redirect("/dashboard")
})

// FOLLOW USER
app.post('/follow', checkAuth, async (req, res) => {

    if(req.user.username == req.body.follow){
        res.redirect("/dashboard");
        next();
    }

    try {
        const user = await queries.selectUserFromUsername(req.body.follow);
        const fid = await queries.isUserFollowing(req.user.uid, user.rows[0].uid);
        console.log("FID ROWS", fid.rows);
        if(fid.rows.length == 0){
            const follow = await queries.followUser(req.user.uid, user.rows[0].uid);
            res.redirect('/user/'+ req.body.follow);
        } else {
            const unfollow = await queries.unfollowUser(fid.rows[0].fid);
            res.redirect('/user/'+ req.body.follow);
        }

    } catch (err) {
        console.log(err);
    }
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