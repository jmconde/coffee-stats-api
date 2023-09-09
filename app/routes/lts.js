const express = require('express');
const router = express.Router();

const { getList, getWhitelist, getPilotInfoInTime } = require('../controllers/sessionsController');
const { getSessions } = require('../db/mongo/mongoSessions');



router.get('/sessions', async(req, res) => {
  try {
    const data = await getSessions(req.query);
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
  }
});

router.get('/list/today', async(req, res) => {
  try {
    const data = await getList('LTS', req.isAuthenticated());
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
  }
})

router.get('/whitelist', async(req, res) => {
  try {
    const data = await getWhitelist();
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
  }
});

router.get('/list/previous/:start/:end', async(req, res) => {
  try {
    const data = await getPilotInfoInTime(req, );
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;