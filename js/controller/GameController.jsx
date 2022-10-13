const GameController = {
  isValidMove: (x, y, playerX, playerY, width, height) => {
    let isValid = false;
    if (x >= 0 && x < width && y >= 0 && y < height) {
      const distance = Math.abs(x - playerX) + Math.abs(y - playerY);
      if (distance === 1 && (x !== playerX || y !== playerY)) {
        isValid = true;
      }
    }

    return isValid;
  },

  moves: (x, y, width, height) => {
    const moves = [];

    GameController.isValidMove(x, y - 1, x, y, width, height) && moves.push({ x, y: y - 1 });
    GameController.isValidMove(x + 1, y, x, y, width, height) && moves.push({ x: x + 1, y });
    GameController.isValidMove(x, y + 1, x, y, width, height) && moves.push({ x, y: y + 1 });
    GameController.isValidMove(x - 1, y, x, y, width, height) && moves.push({ x: x - 1, y });

    return moves;
  },

  direction(a, b) {
    let direction;
    if (a.x === b.x) {
      direction = b.y > a.y ? 'down' : 'up';
    }
    else if (a.y === b.y) {
      direction = b.x > a.x ? 'right' : 'left';
    }

    return direction;
  }
};
