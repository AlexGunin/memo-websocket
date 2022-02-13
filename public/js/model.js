export class Model {
  board = [];

  constructor() {

  }

  async getDataForGame(amount) {
    const count = Math.floor(amount / 2);
    const response = await fetch(`https://dog.ceo/api/breeds/image/random/${count}`);
    const result = await response.json();
    return result.message;
  }

  createCards(arr) {
    const result = arr.map((image, index) => `
  <div class="game-card" data-id="${index}">
      <div class="front image-game"></div>
      <div class = "back image-wrap">
        <img class = "image-game" src ="" alt="Изображение для игры">
      </div>
  </div>
    `);
    return result.join('');
  }
}
