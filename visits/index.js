const express = require("express");
const redis = require("redis");
const process = require("process");

const app = express();
const client = redis.createClient({
	host: 'redis-server',
	port: 6379
});
const _PORT = 8081
client.set("visits", 0);

app.get("/", (req, res) => {
	client.get("visits", (err, visits) => {
		res.send("Number of visits is " + visits)
		client.set("visits", parseInt(visits) + 1)
	})
});

app.get("/stop", (req, res) => {
	process.exit(0)
})

app.listen(_PORT, () => {
	console.log("Listening to " + _PORT)
});
