import { Controller } from './controller.js';
import { Model } from './model.js';
import { View } from './view.js';
import { socket } from './socket.js';

const gameContainer = document.querySelector('.game-container');
gameContainer.onclick = game;
const USER_ID = gameContainer.dataset.id;
const nav = document.querySelector('.nav');

nav.remove();

// const square = window.innerWidth * window.innerHeight - (0.04 * Math.min(innerWidth, innerHeight) * (innerWidth + innerHeight));
// const AMOUNT = Math.floor(square / (0.015 * Math.max(innerWidth, innerHeight) * Math.max(innerWidth, innerHeight)));

const controller = new Controller({ model: new Model(), view: new View() });

function getUniqueGameId() {
  const pathname = window.location.pathname.split('/');
  return pathname[pathname.length - 1];
}

socket.onopen = function () {
  socket.send(JSON.stringify({ type: 'BOARD:GENERATE', data: { gameId: getUniqueGameId() } }));
};

socket.onmessage = (res) => {
  const result = JSON.parse(res.data);
  const {
    game, currentTurn, cardId, cardsId, image,
  } = result.data;

  switch (result.type) {
    case 'BOARD:GENERATE':
      gameContainer.innerHTML = controller.model.createCards(game);
      controller.view.animateAppearCard(gameContainer);
      disableClick(currentTurn);
      break;
    case 'PLAY':
      changeStateBoard({ cardId, image });
      break;
    case 'GUESS':
      disableClick(0);
      setTimeout(() => {
        makeGuess(cardsId);
        disableClick(currentTurn);
      }, 1000);
      break;
    case 'NEXT:TURN':
      disableClick(0);
      setTimeout(() => {
        resetBoard();
        disableClick(currentTurn);
      }, 2000);
      break;
  }
};

function disableClick(id) {
  console.log(id, +USER_ID);
  if (id !== +USER_ID) {
    gameContainer.onclick = null;
    return;
  }
  if (!gameContainer.onclick) {
    gameContainer.onclick = game;
  }
}

function makeGuess(arr) {
  arr.forEach((item) => {
    const card = gameContainer.querySelectorAll('.game-card')[item];
    card.classList.add('guess');
    card.classList.remove('show');
  });
}

function resetBoard() {
  gameContainer.querySelectorAll('.game-card.show').forEach((card) => {
    const back = card.querySelector('.back');
    setTimeout(() => {
      back.style.backgroundImage = '';
    }, 500);
    card.classList.remove('show');
  });
}

function changeStateBoard({ cardId, image }) {
  const showCards = gameContainer.querySelectorAll('.game-card.show');
  if (showCards.length < 2) {
    const card = gameContainer.querySelector(`.game-card[data-id="${cardId}"]`);
    const back = card.querySelector('.back');
    back.style.backgroundImage = `url("${image}")`;
    card.classList.add('show');
  }
}

function game(event) {
  event.preventDefault();
  console.log(event.target);
  if (event.target.classList.contains('image-wrap')) {
    const gameCard = event.target.closest('.game-card');
    const cardId = gameCard.dataset.id;
    socket.send(JSON.stringify({ type: 'PLAY', data: { gameId: getUniqueGameId(), cardId } }));
  }
}
