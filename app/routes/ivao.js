const express = require('express');
const { getList, getWhitelist, getLatestsFlightPlans, getLatestSessions } = require('../controllers/sessionsController');
const { getSessions } = require('../db/mongo/mongoSessions');
const { getIvaoPilotsNow } = require('../requests/ivao/session');
const router = express.Router();

const { getIvaoWazzup } = require('../requests/ivao/wazzup');

router.get('/wazzup', async(req, res) => {
  try {
    const data = await getIvaoWazzup();
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
  }
});

router.get('/sessions', async(req, res) => {
  try {
    const data = await getSessions(req.query);
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
  }
});

router.get('/sessions/now', async(req, res) => {
  try {
    const data = await getIvaoPilotsNow();
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
  }
});

router.get('/sessions/all/now', async(req, res) => {
  try {
    const data = await getLatestSessions();
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
  }
});

router.get('/flightplans/latest', async(req, res) => {
  try {
    const data = await getLatestsFlightPlans();
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
  }
})

router.get('/list/today', async(req, res) => {
  try {
    const data = await getList('LTS');
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

module.exports = router;

// http://localhost:3001/api/v1/ivao/sessions?callsign=LTS&from=2022-01-01T00:00:00&to=2022-12-31T23:59:59
// http://localhost:3001/api/v1/ivao/sessions?start=2023-01-05&to=2023-01-05