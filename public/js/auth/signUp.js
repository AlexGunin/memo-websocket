const form = document.querySelector('.auth-form');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const allInputs = form.elements;
  if (allInputs.password.value !== allInputs.repeatPassword.value) {
    alert(form, 'Пароли не совпадают');
    return;
  }
  const response = await fetch('/auth/signup', {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify(Object.fromEntries(new FormData(form))),
  });
  const result = await response.json();
  if (result.error) {
    alert(form, result.error);
    return;
  }
  window.location.href = '/';
});

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
