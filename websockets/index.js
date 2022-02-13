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
    socket.on('message', async (info) => {
      const { type, data } = JSON.parse(decoder.decode(new Uint8Array(info)));
      const {
        roomNumber, userId, ready, gameId, cardId,
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
            rooms[roomNumber] = stateUsers;
          }
          const indexUser = rooms[roomNumber].findIndex((el) => el.userId === +userId);
          if (indexUser > -1) {
            rooms[roomNumber][indexUser].ready = ready;
          } else {
            const newUser = await User.findByPk(userId);
            rooms[roomNumber].push({
              name: newUser.name,
              userId: +userId,
              ready: false,
            });
          }
          const readyness = rooms[roomNumber].map((user) => user.ready).every(Boolean);
          wss.clients.forEach((client) => {
            client.send(JSON.stringify({ type: 'UPDATE', data: rooms[roomNumber] }));
          });
          if (readyness && rooms[roomNumber].length > 1) {
            wss.clients.forEach((client) => {
              client.send(JSON.stringify({ type: 'READY', data: true }));
            });
          }
          break;
        case 'BOARD:GENERATE':
          if (!games.has(gameId)) {
            const room = await Room.findOne({ where: { uniqueGameId: gameId }, include: [User] });
            const randomIndex = Math.ceil(Math.random() * room.Users.length);

            const usersScore = [...room.Users].map((user) => ({
              id: user.id,
              score: 0,
              currentTurn: user.id === randomIndex,
            }));
            // const response = await axios.get('https://dog.ceo/api/breeds/image/random/15');
            const pixabay = await axios.get('https://pixabay.com/api/?key=18272099-9836086b8f8ca37bb957d4294&image_type=photo');
            const response = pixabay.data.hits.map((item) => item.webformatURL).sort(() => Math.random() - 0.5).slice(0, 14);
            const game = response.concat(response).sort(() => Math.random() - 0.5);
            console.log(pixabay.data.hits);
            games.set(gameId, new Map([
              ['started', true],
              ['data', game],
              ['points', usersScore],
            ]));
            const currentTurn = games.get(gameId).get('points').filter((item) => item.currentTurn)[0].id;
            wss.clients.forEach((client) => {
              client.send(JSON.stringify({ type: 'BOARD:GENERATE', data: { game, currentTurn } }));
            });
          } else {
            const game = games.get(gameId).get('data');
            const currentTurn = games.get(gameId).get('points').filter((item) => item.currentTurn)[0].id;
            socket.send(JSON.stringify({ type: 'BOARD:GENERATE', data: { game, currentTurn } }));
          }
          break;
        case 'PLAY':
          const game = games.get(gameId);
          const state = game.get('points');
          console.log(state);
          const currentUser = state.filter((item) => item.currentTurn)[0];
          const currentTurn = currentUser.id;
          let currentOpen = game.get('currentOpen');
          if (!game.has('currentOpen')) {
            game.set('currentOpen', [cardId]);
            currentOpen = game.get('currentOpen');
          } else {
            game.set('currentOpen', [...currentOpen, cardId]);
            currentOpen = game.get('currentOpen');
          }
          const urlImages = new Set(currentOpen.map((item) => game.get('data')[item]));
          if (currentOpen.length === 2) {
            if (urlImages.size === 1) {
              currentUser.score += 1;
              wss.clients.forEach((client) => {
                client.send(JSON.stringify({ type: 'GUESS', data: { cardsId: currentOpen, currentTurn } }));
              });
              game.set('currentOpen', []);
            } else {
              const userTurn = state.filter((user) => !user.currentTurn)[0].id;
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
