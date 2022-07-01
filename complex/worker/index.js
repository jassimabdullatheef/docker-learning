const keys = require("./keys");
const redis = require("redis");

const redisUrl = `redis://${keys.redisHost}:${keys.redisPort}`;
const redisClient = redis.createClient({
  url: redisUrl,
  retry_strategy: () => 1000,
});
redisClient.on("error", (err) => console.log("Redis Client Error", err));
const sub = redisClient.duplicate();
redisClient.connect();
sub.connect();

function fib(index) {
  if (index < 2) return 1;

  return fib(index - 1) + fib(index - 2);
}

sub.subscribe("channel", (message) => {
  redisClient.hSet("values", message, fib(parseInt(message)));
});
