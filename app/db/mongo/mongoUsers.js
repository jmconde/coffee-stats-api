const { mongoExecute } = require('./mongoDBPool');

async function createUserMongo({ id, username, hash, roles = [], firstname, lastname, vid }) {
  return await mongoExecute(async({ database }) => {
    const usersCol = database.collection('users');
    const createdOn = new Date();
    const updatedOn = new Date();
    await usersCol.insertOne({
      id,
      username,
      hash,
      createdOn,
      updatedOn,
      roles,
      firstname,
      lastname,
      vid
    });
  });
}

async function updateUserHash(id, hash) {
  return await mongoExecute(async({ collection }) => {
    return await collection.updateOne({
      id
    }, {
      $set: {
        hash,
        updatedOn: new Date()
      }
    })

  }, { colName: 'users' });
}

async function getUserMongo(username) {
  return await mongoExecute(async({ collection }) => {
    return await collection.findOne({ username });
  }, { colName: 'users' })
}

module.exports = {
  createUserMongo,
  getUserMongo,
  updateUserHash
};