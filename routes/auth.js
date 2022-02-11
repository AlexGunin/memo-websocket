const express = require('express');
const sha256 = require('sha256');
const { User } = require('../db/models');

const router = express.Router();

// /auth
router.get('/signin', (req, res) => {
  res.render('signin');
});
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (user) {
      if (sha256(password) === user.password) {
        req.session.userId = user.id;
        req.session.username = user.name;
        res.json({ message: 'ok' });
      } else {
        res.json({ error: 'Неверный пароль' });
      }
    } else res.json({ error: 'Пользователя с таким email не существует' });
  } catch (error) {
    res.json({ error });
  }
});

router.get('/signup', (req, res) => {
  res.render('signup');
});
router.post('/signup', async (req, res) => {
  console.log(req.body);
  const { email, name, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) {
    try {
      await User.create({ email, name, password: sha256(password) });
      return res.json({ message: 'ok' });
    } catch (error) {
      return res.json({ error });
    }
  }
  return res.json({ error: 'Пользователь с таким email уже существует' });
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.clearCookie('auth');
  res.redirect('/auth/signin');
});

module.exports = router;
