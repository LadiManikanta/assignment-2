const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");
const jwt = require("jsonwebtoken");

const dbPath = path.join(__dirname, "twitterClone.db");
const app = express();
app.use(express.json());
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(2222, () => {
      console.log("start");
    });
  } catch (e) {
    console.log(`error ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.post("/register/", async (request, response) => {
  const { username, password, name, gender } = request.body;
  console.log(username);
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const checkPerson = `
    SELECT *
    FROM user
    WHERE username = '${username}'
  
  `;
  const personDetails = await db.get(checkPerson);
  if (personDetails === undefined) {
    addPerson = `
      INSERT INTO 
        user(name,username,password,gender)
      VALUES('${name}','${username}','${hashedPassword}','${gender}')
    `;
    const passwordLen = password.length;
    console.log(passwordLen);
    if (passwordLen < 6) {
      response.status(400);
      response.send("Password is too short");
    } else {
      await db.run(addPerson);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const checkPerson = `
    SELECT *
    FROM user
    WHERE username = '${username}'
  
  `;
  const personDetails = await db.get(checkPerson);
  if (personDetails === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      personDetails.password
    );
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

const middlewareCheck = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid Access Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.username = payload.username;
        next();
      }
    });
  }
};
const changeStyle = (item) => {
  return {
    username: item.user_name,
    tweet: item.tweet,
    dateTime: item.date_time,
  };
};
app.get("/user/tweets/feed/", middlewareCheck, async (request, response) => {
    const {username} = request;
    const getQuery = `
     SELECT
       user.username, tweet.tweet, tweet.date_time AS dateTime
     FROM
      follower
      INNER JOIN tweet
      ON follower.following_user_id = tweet.user_id
      INNER JOIN user
      ON tweet.user_id = user.user_id
    WHERE
      follower.follower_user_id = ${id of the logged in user}
    ORDER BY
      tweet.date_time DESC
    LIMIT 4;`;
  

  const data = await db.all(getQuery);
  response.send(data.map((doll) => changeStyle(doll)));
});

module.exports = app;

