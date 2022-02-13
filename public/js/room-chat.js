import { socket } from './socket.js';

const USER_ID = document.querySelector('.users').dataset.id;
const checkboxStart = document.querySelector(`.user[data-id="${USER_ID}"] .start`);
const divUsers = document.querySelector('.users');
const splitPathName = window.location.pathname.split('/');
const roomNumber = splitPathName[splitPathName.length - 1];
const inputTheme = document.querySelector('#theme-value');
const selectLanguage = document.querySelector('.language');

const languages = {
  default: /.*/gi,
  ru: /[^а-яА-Я]/gi,
  en: /[^a-zA-Z]/gi,
};

disabledForeignCheckbox();

function getLanguages() {
  return selectLanguage.value;
}

selectLanguage.addEventListener('change', sendLanguage);

function sendLanguage(event) {
  const language = event.target.value;
  socket.send(JSON.stringify({ type: 'LANGUAGE:UPDATE', data: { roomNumber, language } }));
}

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

function changeStateTheme(value) {
  inputTheme.value = value;
}

function sendTheme(event) {
  const themeValue = event.target.value.replace(languages[getLanguages()], '');
  console.log(themeValue);
  if (themeValue) {
    return socket.send(JSON.stringify({ type: 'THEME:UPDATE', data: { roomNumber, themeValue } }));
  }
  event.target.value = '';
}

inputTheme.addEventListener('input', sendTheme);

checkboxStart.addEventListener('input', (event) => {
  const ready = event.target.checked;
  socket.send(JSON.stringify({ type: 'ROOM:UPDATE', data: { roomNumber, userId: USER_ID, ready } }));
});

socket.onopen = function (event) {
  socket.send(JSON.stringify({ type: 'ROOM:UPDATE', data: { roomNumber, userId: USER_ID, ready: false } }));
};
socket.onmessage = function (message) {
  const decodedInfo = JSON.parse(message.data);
  const { data, type } = decodedInfo;
  switch (type) {
    case 'UPDATE':
      changeStatePlayer(data);
      break;
    case 'THEME:UPDATE':
      console.log('themeValue', data.themeValue);
      changeStateTheme(data.themeValue);
      break;
    case 'LANGUAGE:UPDATE':
      selectLanguage.value = data.language;
      break;
    case 'READY':
      inputTheme.removeEventListener('input', sendTheme);
      setTimeout(() => {
        window.location.href = `/prepare/${roomNumber}`;
      }, 500 * USER_ID);
      break;
  }
};
