const db = require('./db')

module.exports = {
    allPosts: (user_id) => {
        return db.pquery("SELECT * FROM posts where user_id = $1 ORDER by date_created DESC;", [user_id]);
    },
    allFollowers: (user_id) => {
        return db.pquery("SELECT username FROM users u LEFT OUTER JOIN follow f ON follower = u.uid where followed = $1;", [user_id])
    },
    allFollowing: (user_id) => {
        return db.pquery("SELECT username FROM users u LEFT OUTER JOIN follow f ON followed = u.uid where follower = $1;", [user_id])
    },
    selectUserFromUsername: (username) => {
        return db.pquery("SELECT * FROM users where username = $1;", [username])
    },
    isUserFollowing: (user1, user2) => {
        //is user1 following user2?
        return db.pquery("SELECT * FROM follow where follower = $1 and followed = $2", [user1, user2])
    },
    followUser: (user1, user2) => {
        return db.pquery("INSERT INTO follow (follower, followed) VALUES($1, $2);", [user1, user2])
    },
    unfollowUser: (fid) => {
        return db.pquery("DELETE FROM follow where fid = $1;", [fid])
    },
    newPost: (title, content, user_id, username) => {
        return db.pquery("INSERT INTO posts (title, body, user_id, author, date_created) VALUES ($1, $2, $3, $4, NOW());", [title, content, user_id, username]);
    },
    newUser: (username, password, email) => {
        return db.pquery("INSERT INTO users (username, password, email, email_verified, isprivate, date_created, last_login) VALUES ($1, $2, $3, $4, false, NOW(),NOW()) RETURNING uid, password;", [username, password, email, false]);
    }

}