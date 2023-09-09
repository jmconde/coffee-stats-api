const { mongoExecute } = require("./mongoDBPool");

const colName = 'sessionTracks';

async function insertSessionTracks(sessionTracks, clear) {
  return await mongoExecute(async({ collection }) => {
    if (clear) {
      collection.deleteMany({});
    }

    await collection.insertMany(sessionTracks);
  }, { colName });
}

async function insertOneSessionTracks(sessionTracks) {
  return await mongoExecute(async({ collection }) => {
    await collection.insertOne(sessionTracks);
  }, { colName });
}

async function getSessionTracks(sessionId) {
  return await mongoExecute(
    async({ collection }) => {
      return await collection.findOne({ sessionId });
    }, { colName }
  );
}

async function updateSessionTracks(tracks) {
  return await mongoExecute(async({ database }) => {
    const tracksCollection = database.collection('sessionTracks');
    await tracksCollection.updateOne({ _id: tracks._id }, { $set: { calculatedTime: tracks.calculatedTime } });
  });
}


module.exports = {
  insertSessionTracks,
  getSessionTracks,
  updateSessionTracks,
  insertOneSessionTracks,
};