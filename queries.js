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
    newPost: (title, content, user_id, username, is_private) => {
        return db.pquery("INSERT INTO posts (title, body, user_id, author, is_private, date_created) VALUES ($1, $2, $3, $4, $5, NOW());", [title, content, user_id, username, is_private]);
    },
    newUser: (username, password, email) => {
        return db.pquery("INSERT INTO users (username, password, email, email_verified, isprivate, date_created, last_login) VALUES ($1, $2, $3, $4, false, NOW(),NOW()) RETURNING uid, password;", [username, password, email, false]);
    },
    updateEmail: (user_id, new_email) => {
        return db.pquery("UPDATE users SET email = $1 WHERE uid = $2", [new_email, user_id])
    },
    updateBio: (user_id, new_bio) => {
        return db.pquery("UPDATE users SET bio = $1 WHERE uid = $2", [new_bio, user_id])
    },
    getPublicPosts: () => {
        return db.pquery("SELECT * FROM posts where is_private = false order by random();");
    }

}