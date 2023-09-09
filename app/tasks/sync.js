const cron = require('node-cron');
const moment = require('moment');

const { getUsersWhitelist, getUsers } = require('../db/mysql/lsaUsers');
const { RedisClient } = require('../db/redis/redis');
const { getHistoricalSessions } = require('../requests/ivao/session');
const { insertSessions } = require('../db/mongo/mongoSessions');

const canRunTasks = process.env.EXECUTE_TASKS_ON_START !== 'false';

async function taskSyncLSAUsers() {
  console.log('Running task', moment().format('HH:mm:ss'));
  try {
    const users = await getUsers();
    const whitelist = await getUsersWhitelist();
    RedisClient.setCollection([
      ['users', users],
      ['users_whitelist', whitelist],
    ]);
  } catch (err) {
    console.log('err :>> ', err);
    console.log('ERR executing taskSyncLSAUsers');
  }
}

async function taskSyncPrevioudDaySessions(callsign) {
  try {
    const from = moment().utc().subtract(1, 'day').startOf('day').format();
    const to = moment().utc().subtract(1, 'day').endOf('day').format();
    console.log(moment().format('DD HH:mm:ss'), 'taskSyncPrevioudDaySessions', from, to);
    const params = {
      callsign,
      from,
      to,
    };
    const data = await getHistoricalSessions(params);
    insertSessions(data);
  } catch (err) {
    console.log('ERR executing taskSyncPrevioudDaySessions');
  }

}

module.exports = {
  sync: function() {
    console.log('canRunTasks :>> ', canRunTasks);
    if (canRunTasks) {
      cron.schedule(process.env.SYNC_TASK_SCHEDULE, () => {
        taskSyncPrevioudDaySessions('LTS');
      });
      // cron.schedule(process.env.USERS_TASK_SCHEDULE, async() => {
      //   taskSyncLSAUsers();
      // });
      console.log('Tasks started.');
    } else {
      console.log('Tasks skipped.');
    }
  },
  taskSyncLSAUsers,
  taskSyncPrevioudDaySessions,
};