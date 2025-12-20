require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const socket = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use(cors({origin: '*'}));

app.use(helmet.hidePoweredBy({ setTo: 'PHP 7.4.3' }));
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.noCache());


// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  }); 

//For FCC testing purposes
fccTestingRoutes(app);
    
// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const portNum = process.env.PORT || 3000;

// Set up server and tests
const server = app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

module.exports = app; // For testing

const io = socket(server);

//store all connected players
const players = {};

io.on('connection', (socket)=> {
  console.log('New Player connected: ' + socket.id);

  const newPlayer = {
    id:socket.id,
    x: Math.floor(Math.random() * 500),
    y: Math.floor(Math.random() * 500),
    score: 0
  };

  players[socket.id] = newPlayer;

  //send all the players to the new player
  socket.emit('playersList', players);

  //notify all other players about the new player
  socket.broadcast.emit('newPlayer', newPlayer);

  //handle player movement
  socket.on('movePlayer', (direction) => {

    const speed = 5;

    if(direction === 'right'){
      players[socket.id].x += speed;
    } else if(direction === 'left'){
      players[socket.id].x -= speed;
    } else if(direction === 'up'){
      players[socket.id].y -= speed;
    } else if(direction === 'down'){
      players[socket.id].y += speed;
    }

    //send updated player position to all players
    io.emit('playerMoved', players[socket.id]);
  });

  // handle collectible collection: increment score and broadcast
  socket.on('collect', ({ value }) => {
    const inc = Number.isFinite(value) ? value : 1;
    if (players[socket.id]) {
      players[socket.id].score = (players[socket.id].score || 0) + inc;
      io.emit('scoreUpdated', players[socket.id]);
    }
  });

  //handle player disconnect
  socket.on('disconnect', () => {
    console.log('Player disconnected: ' , socket.id);
    delete players[socket.id];
    socket.broadcast.emit('playerDisconnected', socket.id);
  });

})