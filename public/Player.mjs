class Player {
  constructor({x, y, score, id}) {
    this.x = x;
    this.y = y;
    this.score = score;
    this.id = id;

  }

  movePlayer(dir, speed) {
    if (dir === 'right'){
      this.x += speed;
    } else if (dir === 'left'){
      this.x -= speed;
    } else if (dir === 'up'){
      this.y -= speed;
    } else if (dir === 'down'){
      this.y += speed;
    }

  }

  collision(item) {
    //if the player touches an Item
    return this.x === item.x && this.y === item.y;

  }

  calculateRank(arr) {
    //sort the array in descending order based on score
    const sortedArr = arr.sort((a, b) => b.score - a.score);

    //find the index of the current player in the sorted array
    const playerIndex = sortedArr.findIndex(player => player.id === this.id);

    //rank is index + 1 (to convert from 0-based to 1-based)
    const rank = playerIndex + 1;

    return `Rank: ${rank} / ${arr.length}`;

  }
}

export default Player;
