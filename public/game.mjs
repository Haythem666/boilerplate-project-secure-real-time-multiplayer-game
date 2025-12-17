import Player from './Player.mjs';
import Collectible from './Collectible.mjs';

const socket = io();
const canvas = document.getElementById('game-window');
const context = canvas.getContext('2d');

const allPlayers = {};
let myPlayer = null;
let collectibles = [];


//When the server sends the players list
socket.on('playersList', (players) => {
    Object.values(players).forEach(playerData => {
        allPlayers[playerData.id] = new Player({
            x: playerData.x,
            y: playerData.y,
            score: playerData.score,
            id: playerData.id
        });

        if (playerData.id === socket.id) {
            myPlayer = allPlayers[playerData.id];
        }
    });

    // ensure at least one collectible exists once we know our grid alignment
    if (collectibles.length === 0 && myPlayer) spawnCollectible();
});

//When a new player joins
socket.on('newPlayer', (playerData) => {
    if(!allPlayers[playerData.id]){
        allPlayers[playerData.id] = new Player({
            x: playerData.x,
            y: playerData.y,
            score: playerData.score || 0,
            id: playerData.id
        });
    } else {
        allPlayers[playerData.id].x = playerData.x;
        allPlayers[playerData.id].y = playerData.y;
    }
});

//When a player disconnects
socket.on('playerDisconnected', (playerId) => {
    delete allPlayers[playerId];
});

// Update positions when server broadcasts movement
socket.on('playerMoved', (player) => {
    if (allPlayers[player.id]) {
        allPlayers[player.id].x = player.x;
        allPlayers[player.id].y = player.y;
        if (typeof player.score === 'number') {
            allPlayers[player.id].score = player.score;
        }
    }
});

// Update score sync
socket.on('scoreUpdated', (player) => {
    if (allPlayers[player.id]) {
        allPlayers[player.id].score = player.score;
    }
});

//When a player moves
document.addEventListener('keydown', (event) => {
    if (!myPlayer) return;

    if (event.key === 'ArrowRight' || event.key === 'd') {
        socket.emit('movePlayer', 'right');
    }else if (event.key === 'ArrowLeft' || event.key === 'a') {
        socket.emit('movePlayer', 'left');
    }else if (event.key === 'ArrowUp' || event.key === 'w') {
        socket.emit('movePlayer', 'up');
    }else if (event.key === 'ArrowDown' || event.key === 's') {
        socket.emit('movePlayer', 'down');
    }
});


// Helper: spawn a collectible on a 5px grid so collision can happen
function spawnCollectible() {
    const grid = 5;
    const size = 10;
    const maxX = canvas.width - size;
    const maxY = canvas.height - size;
    const rxBase = Math.floor((Math.random() * maxX) / grid) * grid;
    const ryBase = Math.floor((Math.random() * maxY) / grid) * grid;
    // align to the same grid remainder as the player's current position
    const alignX = myPlayer ? (myPlayer.x % grid) : 0;
    const alignY = myPlayer ? (myPlayer.y % grid) : 0;
    const rx = Math.min(maxX, rxBase + ((alignX - (rxBase % grid) + grid) % grid));
    const ry = Math.min(maxY, ryBase + ((alignY - (ryBase % grid) + grid) % grid));
    collectibles.push(new Collectible({ x: rx, y: ry, value: 1 }));
}

// Initial collectible will be spawned after we know myPlayer


function drawGame() {

    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw collectibles
    collectibles.forEach(item => {
        context.fillStyle = 'gold';
        context.fillRect(item.x, item.y, 10, 10);
    });

    //Draw all players
    Object.values(allPlayers).forEach(player => {
        //Draw the avatar
        context.fillStyle = (player.id === socket.id) ? 'blue' : 'red';
        context.fillRect(player.x, player.y, 10, 10);

        //Draw the score
        context.fillStyle = 'black';
        context.font = '12px Arial';
        context.fillText(`Score: ${player.score}`, player.x, player.y - 5);
    });

    // Handle collection for my player
    if (myPlayer && collectibles.length) {
        const remaining = [];
        for (const item of collectibles) {
            if (myPlayer.collision(item)) {
                // update local score
                myPlayer.score += item.value;
                if (allPlayers[myPlayer.id]) {
                    allPlayers[myPlayer.id].score = myPlayer.score;
                }
                // notify server to sync scores
                socket.emit('collect', { value: item.value });
            } else {
                remaining.push(item);
            }
        }
        collectibles = remaining;
        // respawn if none remain
        if (collectibles.length === 0) spawnCollectible();
    }

    requestAnimationFrame(drawGame);

}

drawGame();



