import Player from './Player.mjs';
import Collectible from './Collectible.mjs';

const socket = io();
const canvas = document.getElementById('game-window');
const context = canvas.getContext('2d');

const allPlayers = {};
let myPlayer = null;


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

});

//When a new player joins
socket.on('newPlayer', (playerData) => {
    if(allPlayers[playerData.id]){
        allPlayers[playerData.id].x = playerData.x;
        allPlayers[playerData.id].y = playerData.y;
    }
});

//When a player disconnects
socket.on('playerDisconnected', (playerId) => {
    delete allPlayers[playerId];
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


function drawGame() {

    context.clearRect(0, 0, canvas.width, canvas.height);

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

    requestAnimationFrame(drawGame);

}

drawGame();



