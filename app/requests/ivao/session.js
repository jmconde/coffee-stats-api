const { RedisClient } = require('../../db/redis/redis');
const { request } = require('../request');

const getHistoricalSessions = async({ callsign, userId, from, to }) => {
  //https://api.ivao.aero/v2/tracker/sessions?connectionType=PILOT&callsign=LTS&from=2022-01-01T00:00:00&to=2023-01-04T23:59:59&perPage=50
  const url = 'https://api.ivao.aero/v2/tracker/sessions';
  const params = {
    connectionType: 'PILOT',
    from,
    page: 1,
    perPage: 100,
    to,
  };

  if (callsign) {
    params.callsign = callsign;
  }

  if (userId) {
    params.userId = userId;
  }

  const options = {
    headers: {
      apiKey: process.env.IVAO_APIKEY,
    },
    params,
  };
  return await _requestHistoricalRecursive([], url, options);
};

async function _requestHistoricalRecursive(data, url, options) {
  const { page, pages, items } = await request(url, options);
  data = [...data, ...items];

  if (page !== pages) {
    options.params.page++;
    return await _requestHistoricalRecursive(data, url, options)
  } else {
    return data;
  }
}

async function getIvaoSessionTracks(idSession) {
  const url = `https://api.ivao.aero/v2/tracker/sessions/${idSession}/tracks`;
  const options = {
    headers: {
      apiKey: process.env.IVAO_APIKEY,
    },
  };
  const tracks = await request(url, options);
  return tracks;
}
async function getIvaoSessionLatestTrack(idSession) {
  const url = `https://api.ivao.aero/v2/tracker/sessions/${idSession}/tracks/latest`;
  const options = {
    headers: {
      apiKey: process.env.IVAO_APIKEY,
    },
  };
  const tracks = await request(url, options);
  return tracks;
}


async function getIvaoPilotsNow(all = false) {
  const url = `https://api.ivao.aero/v2/tracker/now/pilots`;
  const options = {
    headers: {
      apiKey: process.env.IVAO_APIKEY,
    },
  };
  const pilots = await request(url, options);

  return all ? pilots : pilots.filter(d => d.callsign.startsWith('LTS'));
}

async function getIvaoLatestSessionFlightPlan(sessionId) {
  const url = `https://api.ivao.aero/v2/tracker/sessions/${sessionId}/flightPlans/latest`;
  const options = {
    headers: {
      apiKey: process.env.IVAO_APIKEY,
    },
  };

  const fp = await request(url, options);
  return fp;
}

module.exports = {
  getHistoricalSessions,
  getIvaoSessionTracks,
  getIvaoPilotsNow,
  getIvaoLatestSessionFlightPlan,
  getIvaoSessionLatestTrack,
}