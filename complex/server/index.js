const keys = require("./keys");

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgress
const { Pool } = require("pg");
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort,
});
pgClient.on("connect", (client) => {
  client
    .query("CREATE TABLE IF NOT EXISTS values (number INT)")
    .catch((err) => console.log(err));
});
pgClient.connect();

// Rdis client setup
const redis = require("redis");
const redisUrl = `redis://${keys.redisHost}:${keys.redisPort}`;
const redisClient = redis.createClient({
  url: redisUrl,
  retry_strategy: () => 1000,
});
redisClient.on("error", (err) => console.log("Redis Client Error", err));
const redisPublisher = redisClient.duplicate();
redisClient.connect();
redisPublisher.connect();

// Express rounte handlers
app.get("/", (req, res) => {
  res.send("Hello");
});
app.get("/values/all", async (req, res) => {
  const values = await pgClient.query("SELECT * from values");

  res.send(values.rows);
});
app.get("/values/current", async (req, res) => {
  const values = await redisClient.hGetAll("values");

  res.send(values);
});
app.post("/values", async (req, res) => {
  const index = req.body.index;

  if (parseInt(index) > 40) {
    return res.status(422).send("Index too high");
  }

  redisClient.hSet("values", "index", "Nothing yet!");
  redisPublisher.publish("channel", index);
  pgClient.query("INSERT INTO values(number) VALUES($1)", [index]);

  res.send({ working: true });
});

app.listen(5000, () => console.log("Listening to port 5000"));
