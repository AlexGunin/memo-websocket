const { Room, User } = require('../db/models');

const gameMiddleware = (req, res, next) => {
  if (req.session.gameId !== req.params.id) {
    return res.redirect('/');
  }
  next();
};
const gameGenerate = async (req, res, next) => {
  const room = await Room.findByPk(req.params.id, { include: [User] });
  const usersId = [...room.Users].map((user) => user.id);
  if (usersId.includes(req.session.userId)) {
    return next();
  }
  return res.redirect('/');
};

module.exports = { gameMiddleware, gameGenerate };
