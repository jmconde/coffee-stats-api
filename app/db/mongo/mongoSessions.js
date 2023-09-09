const { mongoExecute } = require("./mongoDBPool");

const colName = 'sessions';

async function insertSessions(sessions, clear) {
  return await mongoExecute(async({ collection }) => {
    if (clear) {
      collection.deleteMany({});
    }
    await collection.insertMany(sessions);
  }, { colName });
}

async function getSessions(start, end) {
  return await mongoExecute(async({ collection }) => {
    const startDate = start + 'T00:00:00.000Z';
    const endDate = end + 'T23:59:59.999Z';
    const result = await collection.aggregate([{
      $addFields: {
        completedDate: {
          $dateFromString: {
            "dateString": "$completedAt"
          }
        },
        createdDate: {
          $dateFromString: {
            "dateString": "$createdAt"
          }
        },
        updatedDate: {
          $dateFromString: {
            "dateString": "$updatedAt"
          }
        }
      }
    }, {
      $match: {
        createdDate: {
          $gt: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    }]).toArray();
    return result;
  }, { colName });
}

async function getSession(sessionId) {
  return await mongoExecute(async({ collection }) => {
    const session = await collection.findOne({ id: sessionId });
    return session;
  }, { colName: 'sessions' });
}

async function updateSessionCalculatedTime(session) {
  return await mongoExecute(async({ collection }) => {
    await collection.updateOne({ _id: session._id }, { $set: { calculatedTime: session.calculatedTime } });
  }, { colName: 'sessions' });
}

async function getSessionsTotalCalculatedTimeByPilot(start, end) {
  const startDate = start + 'T00:00:00.000Z';
  const endDate = end + 'T23:59:59.999Z';

  return await mongoExecute(async({ collection }) => {
    return await collection.aggregate([{
      $addFields: {
        createdDate: {
          $dateFromString: {
            dateString: "$createdAt",
          },
        },
      },
    }, {
      $match: {
        createdDate: {
          $gt: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    }, {
      $group: {
        _id: "$userId",
        total: {
          $count: {},
        },
        time: {
          $sum: "$calculatedTime",
        },
      },
    }, ]).toArray();
  }, { colName });
}

module.exports = {
  insertSessions,
  getSession,
  getSessions,
  getSessionsTotalCalculatedTimeByPilot,
  updateSessionCalculatedTime,
};

//http://localhost:3001/api/v1/ivao/init-sessions?callsign=LTS&from=2023-01-05T00:00:00&to=2023-01-05T23:59:59