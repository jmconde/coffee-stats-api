const moment = require('moment');
const { getUserFromReferenceTable, getAllUsersFromReferenceTable } = require('../db/mongo/mongoPilots');
const { getSessions, updateSessionCalculatedTime, getSessionsTotalCalculatedTimeByPilot } = require('../db/mongo/mongoSessions');
const { getSessionTracks, updateSessionTracks, insertOneSessionTracks } = require('../db/mongo/mongoSessionTracks');
const { RedisClient } = require('../db/redis/redis');
const { getHistoricalSessions, getIvaoSessionTracks, getIvaoPilotsNow, getIvaoLatestSessionFlightPlan, getIvaoSessionLatestTrack } = require('../requests/ivao/session');
const { getAirTime } = require('./trackerAnalizer');

async function getTodaySessionsFromIvao(callsign, incompletes) {
  const from = moment().utc().startOf('day').format();
  const to = moment().utc().endOf('day').format();
  const params = {
    callsign,
    from,
    to,
  };
  const data = await getHistoricalSessions(params);
  if (!incompletes) {
    return data.filter(d => d.isCompleted);
  }
  return data;

}

async function checkUsername(user, key, usersList) {
  const u = {...user };
  if (!u.name) {

    const ref1 = await getUserFromReferenceTable(key) || {};
    const ref2 = (usersList || []).find(d => key === d.vid) || {};
    let ref;
    if (ref2.name) {
      ref = ref2;
      if (!ref1.name) {
        // TODO: update mongo
      }
    } else if (ref1.name) {
      ref = ref1
    }
    if (ref) {
      u.name = ref.name;
    } else {
      console.log(`Couldn't find info for ${key}`);
    }
  }
  return u;
}

async function getWhitelist() {
  const redisUsers = await RedisClient.getPair('users_whitelist');
  return redisUsers.sort((a, b) => b.flightTime - a.flightTime);

}

async function getSessionCalculatedTime(session) {
  const sessionId = session.id;
  let tracks = await getSessionTracks(sessionId);
  let calculatedTime;
  if (tracks && !Number.isInteger(tracks.calculatedTime)) {
    calculatedTime = getAirTime(tracks);
    tracks.calculatedTime = calculatedTime;
    try {
      await updateSessionTracks(tracks);
    } catch (err) {
      console.log('Error updateSessionTracks');
    }
  } else if (!tracks) {
    const t = await getIvaoSessionTracks(sessionId);
    calculatedTime = getAirTime(t);
    tracks = {
      sessionId,
      tracks: t,
      calculatedTime,
    };
    try {
      await insertOneSessionTracks(tracks);
    } catch (err) {
      console.log('Error insertOneSessionTracks');
    }
  }

  await setSessionCalculatedTime(session, tracks, calculatedTime);
  return tracks.calculatedTime;
}

async function setSessionCalculatedTime(session, tracks, calculatedTime) {
  if (!Number.isInteger(session.calculatedTime)) {
    session.calculatedTime = calculatedTime ? calculatedTime : tracks.calculatedTime;
    await updateSessionCalculatedTime(session);
  }
}

function obfuscate(name, isAuthenticated, from = 1) {
  if (isAuthenticated) {
    return name;
  }
  if (typeof name === 'undefined') {
    return '';
  }
  const arr = name.split(' ');
  const obfuscated = arr.map((token, i) => {
    if (i < from) {
      return token;
    }
    const xs = Array.apply(null, Array(token.length ? token.length - 1 : 0)).map(() => '*');
    return token.charAt(0).toUpperCase() + xs.join('');
  });
  return obfuscated.join(' ');
}

async function getList(callsign, isAuthenticated) {
  const from = moment().startOf('month').format('YYYY-MM-DD');
  const to = moment().subtract(1, 'day').endOf('day').format('YYYY-MM-DD');
  const todayData = await getTodaySessionsFromIvao(callsign);
  const monthData = await getSessions(from, to);
  const allData = [...todayData, ...monthData];
  const redisUsers = await RedisClient.getPair('users');
  const totalsByUserId = {};

  for (let index = 0; index < allData.length; index++) {
    const session = allData[index];
    const userId = session.userId;
    const flightPlan = session.flightPlans[session.flightPlans.length - 1];
    const date = moment(session.completedAt);
    const calculated = await getSessionCalculatedTime(session);
    if (!totalsByUserId[userId]) {
      totalsByUserId[userId] = {
        time: 0,
        flights: 0,
        sessionsTime: 0,
      };
    }
    totalsByUserId[userId].time += calculated;
    totalsByUserId[userId].sessionsTime += session.time || 0;
    totalsByUserId[userId].flights++;

    if (!totalsByUserId[userId].lastFlight || date.isAfter(totalsByUserId[userId].lastFlightDate)) {
      totalsByUserId[userId].lastFlight = {...flightPlan };
      totalsByUserId[userId].lastFlightDate = date;
      totalsByUserId[userId].lastCallsign = session.callsign;

      delete totalsByUserId[userId].lastFlight.id;
      if (session.user.firstName) {
        totalsByUserId[userId].name = `${session.user.firstName} ${session.user.lastName || ''}`;
      }
      totalsByUserId[userId].division = session.user.divisionId;
    }
  }

  const array = [];
  for (const key in totalsByUserId) {
    if (Object.hasOwnProperty.call(totalsByUserId, key)) {
      const user = await checkUsername(totalsByUserId[key], key, redisUsers);
      user.vid = key;
      user.name = obfuscate(user.name, isAuthenticated);
      array.push(user);
    }
  }
  return array.filter(d => d.time > 0);
}

async function getLatestSessions() {
  return await getIvaoPilotsNow();
}

async function getLatestsFlightPlans() {
  const sessionsNow = await getLatestSessions();
  const response = [];
  for (let index = 0; index < sessionsNow.length; index++) {
    const session = sessionsNow[index];
    const sessionFlightplan = await getIvaoLatestSessionFlightPlan(session.id);
    const track = await getIvaoSessionLatestTrack(session.id);
    const fplan = {};
    fplan.sessionId = session.id;
    fplan.callsign = session.callsign;
    fplan.arrival = sessionFlightplan.arrival;
    fplan.departure = sessionFlightplan.departure;
    fplan.departureTime = sessionFlightplan.departureTime;
    fplan.eet = sessionFlightplan.eet;
    fplan.eta = track.groundSpeed === 0 ? 0 : Math.round((track.arrivalDistance / track.groundSpeed) * 3600);
    fplan.arrivalDistance = track.arrivalDistance;
    fplan.groundSpeed = track.groundSpeed;

    response.push(fplan);

  }
  return response;
}

async function getPilotInfoInTime(req) {
  const { start, end } = req.params;
  const redisUsers = await RedisClient.getPair('users');
  const pilots = await getAllUsersFromReferenceTable();
  const data = await getSessionsTotalCalculatedTimeByPilot(start, end);
  for (let index = 0; index < data.length; index++) {
    const row = data[index];
    const user = (redisUsers || pilots).find(d => Number(d.vid) === row._id) || { name: '657396' };
    user.name = obfuscate(user.name, req.isAuthenticated());
    row.user = user;
  }
  return data.sort((a, b) => b.time - a.time);
}

module.exports = {
  getList,
  getWhitelist,
  getLatestSessions,
  getLatestsFlightPlans,
  getPilotInfoInTime,
};