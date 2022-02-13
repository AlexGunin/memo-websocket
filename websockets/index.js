const { WebSocket } = require('ws');
const axios = require('axios');
const { User, Room } = require('../db/models');

const decoder = new TextDecoder('utf-8');
const games = new Map();
const rooms = {};

const webSocket = function (expressServer) {
  const wss = new WebSocket.Server({
    noServer: true,
  });
  expressServer.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (websocket) => {
      wss.emit('connection', websocket, request);
    });
  });
  wss.on('connection', (socket, req) => {
    console.log('connection');
    console.log(rooms);
    socket.on('message', async (info) => {
      const { type, data } = JSON.parse(decoder.decode(new Uint8Array(info)));
      const {
        roomNumber, userId, ready, gameId, cardId, themeValue, language,
      } = data;
      switch (type) {
        case 'ROOM:UPDATE':
          if (!rooms[roomNumber]) {
            const room = await Room.findByPk(roomNumber, { include: [User] });
            const stateUsers = [...room.Users].map((user) => ({
              name: user.name,
              userId: user.id,
              ready: false,
            }));
            rooms[roomNumber] = { users: stateUsers, theme: '', language: 'default' };
          }
          const roomUsers = rooms[roomNumber].users;
          const indexUser = roomUsers.findIndex((el) => el.userId === +userId);
          if (indexUser > -1) {
            roomUsers[indexUser].ready = ready;
          } else {
            const newUser = await User.findByPk(userId);
            roomUsers.push({
              name: newUser.name,
              userId: +userId,
              ready: false,
            });
          }
          const readyness = roomUsers.map((user) => user.ready).every(Boolean);
          wss.clients.forEach((client) => {
            client.send(JSON.stringify({ type: 'UPDATE', data: roomUsers }));
          });
          if (readyness && roomUsers.length > 1) {
            wss.clients.forEach((client) => {
              client.send(JSON.stringify({ type: 'READY', data: true }));
            });
          }
          break;
        case 'THEME:UPDATE':
          rooms[roomNumber].theme = themeValue;
          console.log(rooms[roomNumber].theme);
          console.log(rooms[roomNumber]);
          wss.clients.forEach((client) => {
            if (client !== socket && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'THEME:UPDATE', data: { themeValue } }));
            }
          });
          break;
        case 'LANGUAGE:UPDATE':
          rooms[roomNumber].language = language;
          console.log(rooms[roomNumber]);
          wss.clients.forEach((client) => {
            if (client !== socket && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'LANGUAGE:UPDATE', data: { language } }));
            }
          });
          break;
        case 'BOARD:GENERATE':
          if (!games.has(gameId)) {
            const room = await Room.findOne({ where: { uniqueGameId: gameId }, include: [User] });
            const randomIndex = Math.ceil(Math.random() * room.Users.length);

            const usersScore = [...room.Users].map((user) => ({
              id: user.id,
              name: user.name,
              score: 0,
              currentTurn: user.id === randomIndex,
            }));
            const choicedTheme = rooms[room.id]?.theme || 'nature';
            const encodeTheme = encodeURI(choicedTheme.split(' ').join('+'));
            const choicedLanguage = rooms[room.id]?.language || 'en';
            const URL = `https://pixabay.com/api/?key=18272099-9836086b8f8ca37bb957d4294&q=${encodeTheme}&lang=${choicedLanguage.trim().toLowerCase()}&image_type=photo&orientation=horizontal`;
            const pixabay = await axios.get(URL);
            const response = pixabay.data.hits.map((item) => item.webformatURL).sort(() => Math.random() - 0.5).slice(0, 14);
            const game = response.concat(response).sort(() => Math.random() - 0.5);
            games.set(gameId, new Map([
              ['started', true],
              ['data', game],
              ['points', usersScore],
            ]));
            const currentScore = games.get(gameId).get('points');
            const currentTurn = currentScore.filter((item) => item.currentTurn)[0].id;
            wss.clients.forEach((client) => {
              client.send(JSON.stringify({ type: 'BOARD:GENERATE', data: { game, currentTurn, currentScore } }));
            });
          } else {
            const game = games.get(gameId).get('data');
            const currentScore = games.get(gameId).get('points');
            const currentTurn = currentScore.filter((item) => item.currentTurn)[0].id;
            socket.send(JSON.stringify({ type: 'BOARD:GENERATE', data: { game, currentTurn, currentScore } }));
          }
          break;
        case 'PLAY':
          const game = games.get(gameId);
          const currentScore = game.get('points');
          const currentUser = currentScore.filter((item) => item.currentTurn)[0];
          const currentTurn = currentUser.id;
          if (!game.has('currentOpen')) {
            game.set('currentOpen', [cardId]);
          } else {
            game.get('currentOpen').push(cardId);
          }
          const currentOpen = game.get('currentOpen');
          const urlImages = new Set(currentOpen.map((item) => game.get('data')[item]));
          if (currentOpen.length === 2) {
            if (urlImages.size === 1) {
              currentUser.score += 1;
              wss.clients.forEach((client) => {
                client.send(JSON.stringify({ type: 'GUESS', data: { cardsId: currentOpen, currentScore, currentTurn } }));
              });
              game.set('currentOpen', []);
            } else {
              const userTurn = currentScore.filter((user) => !user.currentTurn)[0].id;
              game.get('points').forEach((item) => {
                item.currentTurn = !item.currentTurn;
              });
              game.set('currentOpen', []);
              wss.clients.forEach((client) => {
                client.send(JSON.stringify({ type: 'NEXT:TURN', data: { cardId, currentTurn: userTurn } }));
              });
            }
          }
          wss.clients.forEach((client) => {
            client.send(JSON.stringify({ type: 'PLAY', data: { cardId, currentTurn, image: game.get('data')[cardId] } }));
          });
      }
    });
  });

  return wss;
};

module.exports = webSocket;
