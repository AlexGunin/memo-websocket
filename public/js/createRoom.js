const form = document.querySelector('.auth-form');

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
  console.log(result);
  // socket.send(JSON.stringify({type: 'ROOM:CREATE', data}))
});

// socket.onmessage = (data) => {
//   console.log(data)
// }
