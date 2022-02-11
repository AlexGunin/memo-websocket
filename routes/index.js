const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { User, Room } = require('../db/models');
const { gameMiddleware, gameGenerate } = require('../middleware/gameMiddleware');

const router = express.Router();
const { checkAuth } = require('../middleware/authMiddleware');

/* GET home page. */
router.get('/', async (req, res, next) => {
  const allRooms = await Room.findAll({ include: [User] });
  res.render('main', { allRooms });
});

router.get('/prepare/:id', gameGenerate, async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id, { include: [User] });
    const uniqueId = room.uniqueGameId;
    if (uniqueId) {
      req.session.gameId = uniqueId;
      res.redirect(`/game/${uniqueId}`);
    } else {
      const generateId = await uuidv4();
      await room.update({ uniqueGameId: generateId });
      req.session.gameId = generateId;
      res.redirect(`/game/${generateId}`);
    }
  } catch (error) {
    res.json({ error });
  }
});
router.get('/game/:id', gameMiddleware, async (req, res) => {
  res.render('index', { userId: req.session.userId });
});
router.patch('/room', async (req, res) => {
  const { roomNumber, userId } = req.body;
  try {
    await User.update({ room_id: roomNumber }, { where: { id: userId } });
    res.json({ message: 'ok' });
  } catch (error) {
    res.json({ error });
  }
});
router.get('/room/:id', async (req, res) => {
  const room = await Room.findByPk(req.params.id, { include: [User] });

  res.render('room', { room });
});
router.get('/rooms', async (req, res) => {
  const allRooms = await Room.findAll({ include: [User] });
  res.json(allRooms);
});
router.get('/join', checkAuth, (req, res, next) => {
  res.render('joinRoom');
});
router.post('/join', (req, res, next) => {
  res.render('enterRoom');
});
router.get('/create', checkAuth, (req, res, next) => {
  res.render('createRoom');
});
router.post('/create', async (req, res, next) => {
  const { roomNumber: number, password } = req.body;
  try {
    const room = await Room.findOne({ where: { number } });
    if (!room) {
      const newRoom = await Room.create({ number, password, isStarted: false });
      res.json({ message: 'ok', newRoom });
    } else {
      res.json({ error: 'Комната с таким номером уже создана' });
    }
  } catch (error) {
    res.json({ error });
  }
});
module.exports = router;
