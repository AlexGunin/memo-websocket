const form = document.querySelector('.modal-form');
const table = document.querySelector('.table-rooms');

function alert(parent, message, type = 'danger') {
  if (parent.querySelector('.alert')) {
    return;
  }
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `<div class="alert alert-${type} alert-dismissible" role="alert">${message}<button type="button" class="btn-close" aria-label="Close"></button></div>`;

  const btnClose = wrapper.querySelector('.btn-close');
  btnClose.addEventListener('click', closeAlert.bind(null, wrapper));

  wrapper.classList.add('fadeIn');
  parent.prepend(wrapper);
}

function closeAlert(wrapper, event) {
  event.preventDefault();
  wrapper.classList.add('fadeOut');
  setTimeout(() => {
    wrapper.remove();
  }, 500);
}

function createRow(obj) {
  console.log(obj);
  const row = document.createElement('tr');
  row.setAttribute('data-id', obj.id);
  row.innerHTML = `<td>${obj.number}</td><td>${obj.password}</td><td>${obj.Users?.length ?? 0}</td><td>${obj.isStarted}</td>    <td>
          <button type="button" class="btn btn-success enter">Войти</button>
        </td>`;
  return row;
}

async function updateTable() {
  const response = await fetch('/rooms');
  const result = await response.json();
  table.tBodies[0].innerHTML = '';
  result.forEach((item) => {
    table.tBodies[0].append(createRow(item));
  });
}

table.addEventListener('click', async (event) => {
  if (event.target.classList.contains('enter')) {
    const userId = event.target.closest('table').dataset.userid;
    const roomNumber = event.target.closest('tr').dataset.id;

    const response = await fetch('/room', {
      method: 'PATCH',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ roomNumber, userId }),
    });
    const result = await response.json();
    if (!result.error) {
      window.location.href = `/room/${roomNumber}`;
    }
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const response = await fetch('/create', {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (result.error) {
    return alert(form, result.error);
  }
  const modal = form.closest('.modal-dialog');
  console.log(result);
  table.append(createRow(result.newRoom));
  modal.querySelector('.btn-close').click();
});

setTimeout(async function update() {
  setTimeout(update, 5000);
  await updateTable();
}, 5000);
