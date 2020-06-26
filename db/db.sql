CREATE TABLE users (
    uid SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE,
    password TEXT,
    bio VARCHAR,
    email VARCHAR(255),
    email_verified BOOLEAN,
    isPrivate BOOLEAN,
    date_created DATE,
    last_login DATE
);

CREATE TABLE posts (
    pid SERIAL PRIMARY KEY,
    title VARCHAR(255),
    body VARCHAR,
    user_id INT REFERENCES users(uid),
    author VARCHAR REFERENCES users(username),
    is_private BOOLEAN,
    date_created TIMESTAMP
);

CREATE TABLE follow (
    fid SERIAL PRIMARY KEY,
    follower INT REFERENCES users(uid),
    followed INT REFERENCES users(uid)
)