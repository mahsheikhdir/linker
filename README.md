# linker

Express Blog where users can follow others and make private/public posts. Built with Express and EJS. You can see this project here: [Link](https://linkup-linker.herokuapp.com/).


### Installing

```
git clone https://github.com/mahsheikhdir/linker.git
npm install
```

If you are using PostgreSQL locally set up the host in the ```db/index.js``` file. An example is shown in the comments.

### Features

After logging in users can create a public or private post using Markdown which will be sanitized when posted. Private posts are only shown to users that follow each other. Public posts may appear on the front page in random order. Lastly users have a dashboard to see all their posts and followers and change personal information (email and bio). 

### Scripts

```
npm start 
# Start app 
```
