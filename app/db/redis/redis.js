const { createClient } = require('redis');

class RedisClient {
  constructor(host) {
    this._host = host;
  }

  get client() {
    return this._client;
  }

  async connect() {
    const client = createClient({
      socket: {
        host: this._host,
      },
    });
    client.on('error', (err) => console.log('Redis Client Error', err));
    await client.connect();
    this._client = client;
    return client;
  }

  async set(key, value) {
    await this._client.set(key, value);
    return value;
  }

  async get(key) {
    const value = await this._client.get(key);
    return value;
  }

  async disconnect() {
    await this._client.disconnect();
  }

}

RedisClient.setPair = async function(key, value) {
  const redis = new RedisClient(process.env.REDIS_HOST);
  await redis.connect();
  await redis.set(key, JSON.stringify(value));
  await redis.disconnect();
}

RedisClient.getPair = async function(key) {
  const redis = new RedisClient(process.env.REDIS_HOST);
  await redis.connect();
  const value = await redis.get(key);
  await redis.disconnect();
  return JSON.parse(value);
}

RedisClient.setCollection = async function(array) {
  const redis = new RedisClient(process.env.REDIS_HOST);

  await redis.connect();
  if (Array.isArray(array)) {
    for (let index = 0; index < array.length; index++) {
      const pair = array[index];
      if (Array.isArray(pair)) {
        await redis.set(pair[0], JSON.stringify(pair[1]));
      } else {
        await redis.set(pair.key, JSON.stringify(pair.value));
      }
    }
  } else {
    for (const key in array) {
      if (Object.hasOwnProperty.call(array, key)) {
        const value = array[key];
        await redis.set(key, JSON.stringify(value));
      }
    }
  }
  await redis.disconnect();
}


module.exports = {
  RedisClient,
};