const config = require("../config");
const { runWithRedis } = require("./redis");

const getJson = async (key) => runWithRedis(async (redis) => {
  const value = await redis.get(key);
  return value ? JSON.parse(value) : null;
});

const setJson = async (key, value, ttlSeconds = config.cacheTtlSeconds) => runWithRedis(async (redis) => {
  await redis.set(key, JSON.stringify(value), "EX", Math.max(1, Number(ttlSeconds) || 30));
  return true;
});

const deleteKey = async (key) => runWithRedis((redis) => redis.del(key));

const getOrSetJson = async (key, loader, ttlSeconds = config.cacheTtlSeconds) => {
  const cached = await getJson(key);
  if (cached !== null) return cached;
  const value = await loader();
  await setJson(key, value, ttlSeconds);
  return value;
};

module.exports = { getJson, setJson, deleteKey, getOrSetJson };
