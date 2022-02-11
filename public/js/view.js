export class View {

  animateAppearCard(gameContainer) {
    const allCards = [...gameContainer.querySelectorAll('.game-card')]
    const animation = ['moveRight', 'moveLeft', 'moveTop', 'moveBottom']
    allCards.forEach((card, index, arr) => {
      const randomAnimation = animation[Math.floor(Math.random() * animation.length)]
      setTimeout(() => {
        card.classList.add(randomAnimation)
      }, (arr.length - index) * 20)
    })
  }

}


