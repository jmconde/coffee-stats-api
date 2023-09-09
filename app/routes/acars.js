const express = require('express');
const { updatePosition, getPosition } = require('../controllers/acarsController');
const router = express.Router();

router.post(`/report`, (req, res) => {
  updatePosition(req);
  res.status(200).send();
});

router.get(`/position`, async(req, res) => {
  res.status(200).send(await getPosition(req));
});

module.exports = router;