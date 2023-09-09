const { RedisClient } = require('../db/redis/redis');

const USER_POSITION_DATA = 'user_position_data';

function updatePosition(req) {
  RedisClient.setPair(USER_POSITION_DATA, JSON.stringify([req.body]));
}

async function getPosition() {
  const data = await RedisClient.getPair(USER_POSITION_DATA);
  return data;
}


module.exports = {
  updatePosition,
  getPosition,
};