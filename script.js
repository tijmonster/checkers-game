const gameBoard = document.getElementById('game-board');
const currentPlayerDisplay = document.getElementById('current-player');
const boardSize = 10;

let currentPlayer = 'white'; // White moves first
let selectedPiece = null;
let selectedPieceMoves = [];

// Initialize the game board
/**
 * Sets up a checkers game board by creating a 10x10 grid of cells, assigning colors, and placing pieces.
 */
function initializeBoard() {
    const boardSize = 10;

    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');

            if ((row + col) % 2 === 0) {
                cell.classList.add('white');
            } else {
                cell.classList.add('black');
                // Add pieces to the board
                const pieceColor = row < 4 ? 'black' : row > 5 ? 'white' : null;
                if (pieceColor) {
                    const piece = document.createElement('div');
                    piece.classList.add('piece', pieceColor);
                    cell.appendChild(piece);
                }
            }

            cell.dataset.row = row;
            cell.dataset.col = col;
            gameBoard.appendChild(cell);
        }
    }
}

initializeBoard();

gameBoard.addEventListener('click', handleCellClick);

function handleCellClick(event) {
    const target = event.target;

    if (target.classList.contains('piece') && target.classList.contains(currentPlayer)) {
        if (hasMandatoryCapture()) {
            const captureMoves = getMandatoryCaptures();
            if (captureMoves.some(cm => cm.piece === target)) {
                selectPiece(target, captureMoves.filter(cm => cm.piece === target).map(cm => cm.move));
            }
        } else {
            selectPiece(target, getValidMoves(target));
        }
    } else if (target.classList.contains('cell') && selectedPiece) {
        const targetRow = parseInt(target.dataset.row);
        const targetCol = parseInt(target.dataset.col);
        if (selectedPieceMoves.some(move => move.row === targetRow && move.col === targetCol)) {
            movePiece(selectedPiece, targetRow, targetCol);
        }
    }
}

function selectPiece(piece, moves) {
    if (selectedPiece) {
        selectedPiece.classList.remove('selected');
    }
    selectedPiece = piece;
    selectedPiece.classList.add('selected');
    selectedPieceMoves = moves;
    highlightValidMoves();
}

function getValidMoves(piece) {
    const pieceRow = parseInt(piece.parentElement.dataset.row);
    const pieceCol = parseInt(piece.parentElement.dataset.col);
    const pieceColor = piece.classList.contains('white') ? 'white' : 'black';
    const moves = [];
    const directions = piece.classList.contains('king') ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : [[1, -1], [1, 1], [-1, -1], [-1, 1]];

    directions.forEach(([rowOffset, colOffset]) => {
        const newRow = pieceRow + rowOffset;
        const newCol = pieceCol + colOffset;

        if (!piece.classList.contains('king')) {
            if ((pieceColor === 'white' && rowOffset < 0) || (pieceColor === 'black' && rowOffset > 0)) {
                if (isValidMove(pieceRow, pieceCol, newRow, newCol, pieceColor)) {
                    moves.push({ row: newRow, col: newCol, captured: false });
                }
            }

            const jumpRow = pieceRow + 2 * rowOffset;
            const jumpCol = pieceCol + 2 * colOffset;
            if (isValidCapture(pieceRow, pieceCol, jumpRow, jumpCol, pieceColor)) {
                moves.push({ row: jumpRow, col: jumpCol, captured: true });
            }
        } else {
            addKingMoves(pieceRow, pieceCol, rowOffset, colOffset, pieceColor, moves);
        }
    });

    return moves;
}


function addKingMoves(pieceRow, pieceCol, rowOffset, colOffset, color, moves) {
    const addMove = (r, c, captured) => moves.push({ row: r, col: c, captured });

    const exploreMoves = (r, c, isCapture) => {
        let row = r + rowOffset;
        let col = c + colOffset;

        while (isValidMove(r, c, row, col, color, true)) {
            addMove(row, col, isCapture);
            row += rowOffset;
            col += colOffset;
        }
    };

    let newRow = pieceRow + rowOffset;
    let newCol = pieceCol + colOffset;

    while (isValidMove(pieceRow, pieceCol, newRow, newCol, color, true)) {
        addMove(newRow, newCol, false);
        newRow += rowOffset;
        newCol += colOffset;
    }

    newRow = pieceRow + rowOffset;
    newCol = pieceCol + colOffset;

    while (isValidCapture(pieceRow, pieceCol, newRow, newCol, color, true)) {
        exploreMoves(newRow, newCol, true);
        newRow += rowOffset;
        newCol += colOffset;
    }
}

function isValidMove(startRow, startCol, endRow, endCol, color, isKing = false) {
    const withinBoundaries = endRow >= 0 && endRow < boardSize && endCol >= 0 && endCol < boardSize;
    if (!withinBoundaries) {
        return false;
    }

    const endCell = document.querySelector(`[data-row="${endRow}"][data-col="${endCol}"]`);
    if (!endCell || endCell.children.length > 0) {
        return false;
    }

    const rowDiff = Math.abs(endRow - startRow);
    const colDiff = Math.abs(endCol - startCol);

    if (isKing) {
        return rowDiff === colDiff;
    } else {
        return rowDiff === 1 && colDiff === 1;
    }
}

function isValidCapture(startRow, startCol, endRow, endCol, color, isKing = false) {
    if (endRow < 0 || endRow >= boardSize || endCol < 0 || endCol >= boardSize) {
        return false;
    }

    const endCell = document.querySelector(`[data-row="${endRow}"][data-col="${endCol}"]`);
    if (!endCell || endCell.children.length > 0) {
        return false;
    }

    const rowDiff = endRow - startRow;
    const colDiff = endCol - startCol;

    if (isKing) {
        if (Math.abs(rowDiff) >= 2 && Math.abs(colDiff) >= 2 && Math.abs(rowDiff) === Math.abs(colDiff)) {
            const rowDirection = rowDiff > 0 ? 1 : -1;
            const colDirection = colDiff > 0 ? 1 : -1;
            let currentRow = startRow + rowDirection;
            let currentCol = startCol + colDirection;
            let jumped = false;

            while (currentRow !== endRow && currentCol !== endCol) {
                const currentCell = document.querySelector(`[data-row="${currentRow}"][data-col="${currentCol}"]`);
                if (currentCell && currentCell.children.length > 0) {
                    const currentPiece = currentCell.children[0];
                    if (currentPiece.classList.contains(color)) {
                        return false;
                    } else {
                        if (jumped) {
                            return false;
                        }
                        jumped = true;
                    }
                }
                currentRow += rowDirection;
                currentCol += colDirection;
            }
            return jumped;
        }
    } else {
        if (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 2) {
            const jumpedRow = startRow + rowDiff / 2;
            const jumpedCol = startCol + colDiff / 2;
            const jumpedCell = document.querySelector(`[data-row="${jumpedRow}"][data-col="${jumpedCol}"]`);
            if (jumpedCell && jumpedCell.children.length > 0) {
                const jumpedPiece = jumpedCell.children[0];
                if (jumpedPiece.classList.contains(color === 'white' ? 'black' : 'white')) {
                    return true;
                }
            }
        }
    }

    return false;
}


function movePiece(piece, targetRow, targetCol) {
    const oldCell = piece.parentElement;
    const newCell = document.querySelector(`[data-row="${targetRow}"][data-col="${targetCol}"]`);
    const rowDiff = targetRow - parseInt(oldCell.dataset.row);
    const colDiff = targetCol - parseInt(oldCell.dataset.col);
    let captured = false;

    if (Math.abs(rowDiff) >= 2 && Math.abs(colDiff) >= 2) {
        const rowDirection = rowDiff > 0 ? 1 : -1;
        const colDirection = colDiff > 0 ? 1 : -1;
        let currentRow = parseInt(oldCell.dataset.row) + rowDirection;
        let currentCol = parseInt(oldCell.dataset.col) + colDirection;

        while (currentRow !== targetRow && currentCol !== targetCol) {
            const currentCell = document.querySelector(`[data-row="${currentRow}"][data-col="${currentCol}"]`);
            if (currentCell && currentCell.children.length > 0) {
                const currentPiece = currentCell.children[0];
                if (currentPiece.classList.contains(currentPlayer === 'white' ? 'black' : 'white')) {
                    currentPiece.remove();
                    captured = true;
                }
            }
            currentRow += rowDirection;
            currentCol += colDirection;
        }
    }

    newCell.appendChild(piece);
    piece.classList.remove('selected');
    selectedPiece = null;
    selectedPieceMoves = [];
    clearValidMoves();

    if ((targetRow === 0 && piece.classList.contains('white')) || (targetRow === boardSize - 1 && piece.classList.contains('black'))) {
        piece.classList.add('king');
    }

    if (captured) {
        selectedPiece = piece;
        selectedPieceMoves = getValidMoves(piece).filter(move => move.captured);
        if (selectedPieceMoves.length > 0) {
            piece.classList.add('selected');
            highlightValidMoves();
            return;
        }
    }

    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
    currentPlayerDisplay.textContent = currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1);

    if (checkGameOver()) {
        alert(`${currentPlayer === 'white' ? 'Black' : 'White'} wins!`);
    }
}

function checkGameOver() {
    const pieces = document.querySelectorAll(`.piece.${currentPlayer}`);
    for (const piece of pieces) {
        if (getValidMoves(piece).length > 0) {
            return false;
        }
    }
    return true;
}

function highlightValidMoves() {
    clearValidMoves();
    selectedPieceMoves.forEach(move => {
        const cell = document.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`);
        cell.classList.add('valid-move');
    });
}

function clearValidMoves() {
    document.querySelectorAll('.valid-move').forEach(cell => {
        cell.classList.remove('valid-move');
    });
}

function hasMandatoryCapture() {
    const pieces = document.querySelectorAll(`.piece.${currentPlayer}`);
    for (const piece of pieces) {
        const moves = getValidMoves(piece);
        if (moves.some(move => move.captured)) {
            return true;
        }
    }
    return false;
}

function getMandatoryCaptures() {
    const pieces = document.querySelectorAll(`.piece.${currentPlayer}`);
    const captureMoves = [];
    pieces.forEach(piece => {
        const moves = getValidMoves(piece);
        moves.forEach(move => {
            if (move.captured) {
                captureMoves.push({ piece, move });
            }
        });
    });
    return captureMoves;
}
