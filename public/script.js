const socket = io();
const chess = new Chess();
let boardElement = document.querySelector('#chessboard');
let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

function renderBoard() {

    const board = chess.board();
    boardElement.innerHTML = '';
     
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement('div');
            squareElement.classList.add('square', (rowIndex + squareIndex) % 2 === 0 ? 'light' : 'dark');
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add('piece', square.color === 'w' ? 'white' : 'black');
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                squareElement.appendChild(pieceElement);

                pieceElement.addEventListener('dragstart', function(e) {

                    if(pieceElement.draggable){
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                      
                        e.dataTransfer.setData('text/plain', '');
                    }
                  
                });

                pieceElement.addEventListener('dragend', function() {
                    draggedPiece = null;
                    sourceSquare = null;
                });
                squareElement.appendChild(pieceElement)
                
            }
            squareElement.addEventListener('dragover', function(e) {
                e.preventDefault();
            });

            squareElement.addEventListener('drop', function(e) {
                e.preventDefault();
                if(draggedPiece){
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSquare);
                }
               
            });

            boardElement.appendChild(squareElement);
        });
    });
}

function handleMove(source, target) {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q',
    };
    socket.emit('move', move);
}

function getPieceUnicode(piece) {
    const chessPieces = {
        k: '\u2654',
        q: '\u2655',
        r: '\u2656',
        b: '\u2657',
        n: '\u2658',
        p: '\u2659',
        K: '\u265A',
        Q: '\u265B',
        R: '\u265C',
        B: '\u265D',
        N: '\u265E',
        P: '\u265F',
    };
    return chessPieces[piece.type] || '';
}

socket.on('playerRole', (role) => {
    playerRole = role;
    renderBoard();
});

socket.on('spectatorRole', () => {
    playerRole = null;
    renderBoard();
});

socket.on('boardState', (fen) => {
    chess.load(fen);
    renderBoard();
});

socket.on('move', (move) => {
    chess.move(move);
    renderBoard();
});

socket.on('gameOver', (winner) => {
    if (winner === 'Draw') {
        alert("The game ended in a draw. Refresh to start a new game");
    } else if (winner) {
        alert(`${winner} wins! Refresh to start a new game`);
    }
});

renderBoard();
