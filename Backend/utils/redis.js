const Redis = require("ioredis");
const config = require("../config");
const { log } = require("./logger");

let client = null;
let warned = false;

const getRedis = () => {
  if (!config.redisUrl) return null;
  if (client) return client;

  client = new Redis(config.redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });
  client.on("error", (error) => {
    if (!warned) {
      warned = true;
      log("warn", "redis.connection_error", { error: { name: error?.name, message: error?.message } });
    }
  });
  return client;
};

const runWithRedis = async (operation) => {
  const redis = getRedis();
  if (!redis) return null;

  try {
    if (redis.status === "wait") await redis.connect();
    return await operation(redis);
  } catch (error) {
    log("warn", "redis.operation_failed", { error: { name: error?.name, message: error?.message } });
    return null;
  }
};

const closeRedis = async () => {
  if (!client) return;
  await client.quit().catch(() => client.disconnect());
  client = null;
};

module.exports = { getRedis, runWithRedis, closeRedis };
