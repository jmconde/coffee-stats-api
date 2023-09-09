//https://www.airport-data.com/api/ap_info.json?icao=KMIA
//https://airportdb.io/api/v1/airport/KMIA?apiToken=1419332340d1ac0b8c7921d2e38d763532b3d93e7f81382fd87356ac74347004877a5126bae6ef9de3a85f49b90e2426

const {
  request
} = require('./request');

const apiToken = process.env.TOKEN_AIRPORTDB;

async function getAirport(icao = '') {
  const url = `https://airportdb.io/api/v1/airport/${icao.toUpperCase()}`;
  const options = {
    params: {
      apiToken
    }
  };
  return await request(url, options);
}

module.exports = {
  getAirport
};