const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const Chess = require('chess.js').Chess;
const path = require('path');
const app = express();
const server = http.createServer(app);
const chess = new Chess();
const io = socketIo(server);
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

let players = {};
let currPlayer = 'w';

app.get('/', (req, res) => {
    res.render('index');
});

io.on('connection', (socket) => {
    if (!players.white) {
        players.white = socket.id;
        socket.emit('playerRole', 'w');
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit('playerRole', 'b');
    } else {
        socket.emit('spectatorRole');
    }

    socket.on('disconnect', () => {
        if (socket.id == players.white) {
            delete players.white;
        } else if (socket.id == players.black) {
            delete players.black;
        }
    });

    socket.on('move', (move) => {
        try {
            if (chess.turn() === 'w' && socket.id !== players.white) return;
            if (chess.turn() === 'b' && socket.id !== players.black) return;

            const result = chess.move(move);
            if (result) {
                currPlayer = chess.turn();
                io.emit('move', move);
                io.emit('boardState', chess.fen());

                if (chess.isGameOver()) {
                    let winner = null;
                    if (chess.isCheckmate()) {
                        winner = chess.turn() === 'w' ? 'Black' : 'White';
                    } else if (chess.isStalemate() || chess.isInsufficientMaterial() || chess.isThreefoldRepetition()) {
                        winner = 'Draw';
                    }
                    io.emit('gameOver', winner);
                }
            }
        } catch (err) {
            socket.emit('invalidMove', move);
            console.error(err);
        }
    });

});

server.listen(3000);
