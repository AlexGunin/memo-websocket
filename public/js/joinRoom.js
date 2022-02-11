import { socket } from './socket.js';

const form = document.querySelector('.auth-form');
console.log(form);
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  socket.send(JSON.stringify({ type: 'ROOM:JOIN', data }));
});

socket.onmessage = (data) => {
  console.log(data);
};
