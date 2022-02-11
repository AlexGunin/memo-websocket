import { socket } from './socket.js';

const USER_ID = document.querySelector('.users').dataset.id;
const checkboxStart = document.querySelector(`.user[data-id="${USER_ID}"] .start`);
const divUsers = document.querySelector('.users');
const splitPathName = window.location.pathname.split('/');
const roomNumber = splitPathName[splitPathName.length - 1];

function disabledForeignCheckbox() {
  const users = divUsers.querySelectorAll('.user');
  users.forEach((user) => {
    const rowUserId = user.dataset.id;
    if (USER_ID !== rowUserId) {
      user.querySelector('.form-check > input').disabled = true;
    }
  });
}

function changeStatePlayer(arr) {
  arr.forEach(({ userId, ready, name }) => {
    const changeUser = divUsers.querySelector(`[data-id="${userId}"]`);
    console.log(changeUser, userId);
    if (changeUser) {
      const checkbox = changeUser.querySelector('input[type=checkbox]');
      checkbox.checked = ready;
    } else {
      const newUser = document.createElement('div');
      newUser.classList.add('user');
      newUser.setAttribute('data-id', userId);
      newUser.innerHTML = `<span>${name}</span>
    <div class="form-check">
      <input class="form-check-input start"
             id="checkbox-state"
             type="checkbox"
             value=""
             ${ready ? 'checked' : ''}
             >
      <label class="form-check-label"
             for="checkbox-state">
        Готов
      </label>`;
      divUsers.append(newUser);
    }
  });
  disabledForeignCheckbox();
}

disabledForeignCheckbox();

checkboxStart.addEventListener('input', (event) => {
  const ready = event.target.checked;
  socket.send(JSON.stringify({ type: 'ROOM:UPDATE', data: { roomNumber, userId: USER_ID, ready } }));
});

socket.onopen = function (event) {
  socket.send(JSON.stringify({ type: 'ROOM:UPDATE', data: { roomNumber, userId: USER_ID, ready: false } }));
};
socket.onmessage = function (message) {
  const decodedInfo = JSON.parse(message.data);
  switch (decodedInfo.type) {
    case 'UPDATE':
      changeStatePlayer(decodedInfo.data);
      break;
    case 'READY':
      setTimeout(() => {
        window.location.href = `/prepare/${roomNumber}`;
      }, 500 * USER_ID);
      break;
  }
};
