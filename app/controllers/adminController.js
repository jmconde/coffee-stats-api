const moment = require('moment');
const bcrypt = require('bcryptjs');
const crypto = require("crypto");

const { insertSessions } = require("../db/mongo/mongoSessions");
const { createUserMongo, getUserMongo, updateUserHash } = require('../db/mongo/mongoUsers');
const { getHistoricalSessions, getIvaoSessionTracks } = require("../requests/ivao/session");
const { insertSessionTracks } = require('../db/mongo/mongoSessionTracks');

const saltRounds = 10;

async function initSessionsData(opts) {
  const { callsign, userId, from, clear = false } = opts;
  let to = opts.to;
  if (!to) {
    to = moment().utc().subtract(1, 'day').endOf('day').format();
  }
  const data = await getHistoricalSessions({
    callsign,
    userId,
    from,
    to
  });
  await insertSessions(data, clear);

  console.log(`${data.length} sessions inserted.`);
  await initSessionsTracks(data.map(d => d.id), clear);
}

async function initSessionsTracks(sessions, clear) {
  const array = [];
  const batchSize = 50;

  for (let index = 0; index < sessions.length; index++) {
    const sessionId = sessions[index];
    const tracks = await getIvaoSessionTracks(sessionId);
    array.push({
      sessionId,
      tracks,
    });

    if (index < sessions.length - 1 && (index + 1) % batchSize === 0) {
      await pause(5000);
    }
  }
  await insertSessionTracks(array, clear);

  console.log(`${array.length} tracks inserted.`)
}

async function pause(millis) {
  await new Promise((resolve) => setTimeout(resolve, millis));
}

function getHashedPassword(password) {
  const salt = bcrypt.genSaltSync(saltRounds);
  return bcrypt.hashSync(password, salt);
}

async function createUser(request) {
  try {
    const { username, password, roles, firstname, lastname, vid } = request.body;
    const hash = getHashedPassword(password);
    const id = crypto.randomBytes(16).toString("hex");
    return await createUserMongo({ id, username, hash, roles, firstname, lastname, vid });
  } catch (err) {
    console.log('err :>> ', err);
  }
}

async function authenticate(username, password) {
  try {
    const user = await getUserMongo(username);
    if (bcrypt.compareSync(password, user.hash)) {
      delete user.hash;
      return user;
    }
    return undefined;
  } catch (err) {
    console.log('err :>> ', err);
  }
}

async function changePassword(req) {
  const { username } = req.user;
  const { currentPassword, newPassword } = req.body;
  console.log('currentPassword, newPassword :>> ', currentPassword, newPassword);
  const user = await getUserMongo(username);
  if (bcrypt.compareSync(currentPassword, user.hash)) {
    const newHash = getHashedPassword(newPassword);
    return await updateUserHash(user.id, newHash);
  } else {
    throw new Error('wrong-password');
  }
}

module.exports = {
  initSessionsData,
  createUser,
  authenticate,
  changePassword,
}