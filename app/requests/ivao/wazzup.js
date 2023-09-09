const { request } = require('../request');
const url = 'https://api.ivao.aero/v2/tracker/whazzup';

const getIvaoWazzup = async() => {
  return await request(url);
};

module.exports = { getIvaoWazzup };