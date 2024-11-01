import * as Shogi from "./board.js";
import * as Pieces from "./piece.js";
/**
 * @class ShogiUI
 * @classdesc The ShogiUI class manages the user interface for a Shogi game, providing board display, piece movement, and highlighting of selectable positions.
 *
 * @constructor
 * @param {HTMLElement} mainBoardTbody
 * @param {HTMLElement} senteCapturedTbody
 * @param {HTMLElement} goteCapturedTbody
 */
export class ShogiUI {
    /**
     * @function applyBoardToTable
     * @description Apply the board to the table.
     *
     * @returns {void}
     */
    applyBoardToTable() {
        for (let row = 0; row < Pieces.boardSize; row++) {
            for (let col = 0; col < Pieces.boardSize; col++) {
                const piece = this.shogiBoard.matrix[row][col];
                const cell = this.boardCells[row][col];
                this.setCellStyle(cell, piece);
            }
        }
    }
    /**
     * @function setCellStyle
     * @description Set the background color of selectable pieces, the background and orientation of the pieces, and the color when promoted.
     *
     * @param {HTMLElement} cell - The cell to set.
     * @param {Pieces.Piece} piece
     * @returns {void}
     */
    setCellStyle(cell, piece) {
        // backgrounds
        cell.style.backgroundColor = piece.isSente === this.shogiBoard.isSenteTurn ? "darkgreen" : "green";
        cell.style.backgroundImage = piece.isSente !== undefined ? "url('./pic/shogi.gif')" : "none";
        cell.style.backgroundSize = "cover"; // Fill the cell with an image
        cell.style.backgroundRepeat = "no-repeat"; // Disable image repeat
        // texts
        cell.textContent = piece.toString();
        cell.style.transform = piece.isSente ? "rotate(0deg)" : "rotate(180deg)";
        cell.style.color = piece.getIsPromoted() ? "red" : "black";
    }
    /**
     * @function move
     * @description Call the move method of the board class.
     *
     * @param {Pieces.Position} from - Source location.
     * @param {Pieces.Position} to - Destination location
     * @returns {boolean} - Returns whether the move was successful.
    */
    move(from, to) {
        if (this.shogiBoard.move(from, to)) {
            if (!this.isDebugMode)
                this.shogiBoard.goNext();
            this.applyCapturedBoardToTable();
            return true;
        }
        return false;
    }
    /**
     * @function pieceMoveHandler
     * @description Handles piece movement on the Shogi board. If a piece is selected, attempts to move it to the specified target position.
     *              If the move captures the opponent's king, prompts to reset the board.
     *
     * @param {number} targetRow - The row index of the target position.
     * @param {number} targetCol - The column index of the target position.
     *
     * @returns {void}
     *
     * @throws {Error} If there is an issue with board initialization or piece movement.
     */
    pieceMoveHandler(targetRow, targetCol) {
        // Selected
        if (this.selectedPosition) {
            const [fromRow, fromCol] = this.selectedPosition;
            const capturingPiece = this.shogiBoard.matrix[targetRow][targetCol];
            // Success to move
            if (this.move([fromRow, fromCol], [targetRow, targetCol])) {
                // Update the board
                this.applyBoardToTable();
                // Finish
                if (capturingPiece.toString() === "王") {
                    // Prevent confirmation from coming before the board is updated.
                    setTimeout(() => {
                        const doInit = confirm(`${this.shogiBoard.isSenteTurn ? "先手" : "後手"}が勝利しました。盤面を初期化しますか?`);
                        if (doInit)
                            location.reload();
                    }, 0);
                }
            }
            this.selectedPosition = null; // Clear selected position.
        }
    }
    ;
    /**
     * @function viewCanSet
     * @description Highlights where the piece at the selected position can move.
     *
     * @param {Pieces.Position} [row,col] - Source position.
     * @returns {void}
     */
    viewCanSet([row, col]) {
        const piece = this.shogiBoard.matrix[row][col];
        const availablePositions = piece.generateMovePositions([row, col]); // Get the positions that the piece can move to as an array.
        this.selectedPosition = [row, col]; // Origin position.
        let skip = false; // Skip until direction changes.
        // Highlight all possible positions.
        availablePositions.forEach(([moveRow, moveCol]) => {
            var _a;
            const isPartition = moveRow === Pieces.partition[0] && moveCol === Pieces.partition[0];
            const targetCell = (_a = this.boardCells[moveRow]) === null || _a === void 0 ? void 0 : _a[moveCol];
            const Highlight_AddMoveEvent = () => {
                targetCell.style.backgroundColor = "red";
                targetCell.addEventListener("click", this.pieceMoveHandler.bind(this, moveRow, moveCol), { once: true });
            };
            if (!isPartition && targetCell) {
                // Possible locations.
                const targetPiece = this.shogiBoard.matrix[moveRow][moveCol];
                // No white space selected as destination.
                if (targetPiece.isSente !== undefined) {
                    // If it is an opponent's piece, it can be placed.
                    if (targetPiece.isSente !== this.shogiBoard.isSenteTurn && !skip)
                        Highlight_AddMoveEvent();
                    // Can't place anything after that, so skip until the guard arrives.
                    skip = true;
                }
                // No pieces on the road.
                if (!skip)
                    Highlight_AddMoveEvent();
            }
            else {
                // Skip ends because the guards have arrived.
                skip = false;
            }
        });
    }
    /**
     * @function applyCapturedBoardToTable
     * @description Apply captured board to table
     */
    applyCapturedBoardToTable() {
        const initBoard = (boardElement) => {
            boardElement.forEach((rowElement) => {
                rowElement.forEach((cell) => {
                    // Make all cells blank
                    cell.textContent = "";
                    cell.style.backgroundColor = "green";
                    cell.style.backgroundImage = "none";
                });
            });
        };
        const renderCapturedPieces = (capturedArray, capturedBoardElement) => {
            initBoard(capturedBoardElement);
            // Captured pieces
            capturedArray.forEach((piece, index) => {
                var _a, _b;
                const [row, col] = [Math.floor(index / 10), index % 10];
                const cell = (_b = (_a = capturedBoardElement[row]) === null || _a === void 0 ? void 0 : _a[col]) !== null && _b !== void 0 ? _b : null;
                if (!cell)
                    return;
                this.setCellStyle(cell, piece);
            });
        };
        // sente gote set.
        renderCapturedPieces(this.shogiBoard.senteCapturedPieces, this.senteCapturedPieces);
        renderCapturedPieces(this.shogiBoard.goteCapturedPieces, this.goteCapturedPieces);
    }
    /**
     * @function moveCapturedPiece
     * @description Move the captured piece
     *
     * @param {number} row
     * @param {number} col
     * @returns {boolean} - Returns whether it was successful.
     */
    moveCapturedPiece(row, col) {
        if (!this.selectedCapturedPiece)
            return false;
        let capturedPieces = this.shogiBoard.isSenteTurn ? this.shogiBoard.senteCapturedPieces : this.shogiBoard.goteCapturedPieces;
        let selectedIndex = capturedPieces.indexOf(this.selectedCapturedPiece);
        let result = this.shogiBoard.moveCapturedPiece(selectedIndex, [row, col]);
        if (selectedIndex == -1)
            return false;
        this.selectedCapturedPiece = null;
        this.applyBoardToTable();
        this.applyCapturedBoardToTable();
        return result;
    }
    constructor(mainBoardTbody, senteCapturedTbody, goteCapturedTbody) {
        /** This is an instance of the board class.It handle the game, such as moving the pieces. */
        this.shogiBoard = new Shogi.Board();
        this.isDebugMode = false;
        /**
         * When you select a piece, its position is stored.
         * If you select another piece after it has been stored,
         * the piece will move to that location.
         */
        this.selectedPosition = null;
        /**
         * When you select a piece you have, its position will be stored.
         * If you select another piece after it has been stored, the piece will move to that position.
         */
        this.selectedCapturedPiece = null;
        const addCapturedPieceClickEvent = (cell, capturedPieces, rowIndex, colIndex) => {
            cell.addEventListener("click", () => {
                const piece = capturedPieces[rowIndex * 10 + colIndex];
                if (piece && piece.isSente === this.shogiBoard.isSenteTurn) {
                    this.selectedCapturedPiece = piece;
                    cell.style.backgroundColor = "yellow";
                }
            });
        };
        // Get html element
        this.boardCells = Array.from(mainBoardTbody.getElementsByTagName('tr')).map((tr) => Array.from(tr.getElementsByTagName('td')));
        this.senteCapturedPieces = Array.from(senteCapturedTbody.getElementsByTagName('tr')).map((tr) => Array.from(tr.getElementsByTagName('td')));
        this.goteCapturedPieces = Array.from(goteCapturedTbody.getElementsByTagName('tr')).map((tr) => Array.from(tr.getElementsByTagName('td')));
        // Init board
        this.shogiBoard.defaultSet();
        // Publish the instance
        window.shogiUIInstance = this;
        // Added click event for pieces in hand
        this.senteCapturedPieces.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                addCapturedPieceClickEvent(cell, this.shogiBoard.senteCapturedPieces, rowIndex, colIndex);
            });
        });
        this.goteCapturedPieces.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                addCapturedPieceClickEvent(cell, this.shogiBoard.goteCapturedPieces, rowIndex, colIndex);
            });
        });
        // Added board click event.
        this.boardCells.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                cell.addEventListener("click", () => {
                    if (this.selectedCapturedPiece) {
                        // Place the captured piece
                        this.moveCapturedPiece(rowIndex, colIndex);
                    }
                    else if (this.shogiBoard.matrix[rowIndex][colIndex].isSente === this.shogiBoard.isSenteTurn) {
                        // Move piece
                        this.applyBoardToTable();
                        this.viewCanSet([rowIndex, colIndex]);
                    }
                });
            });
        });
        // Display of the initial board and pieces.
        this.applyBoardToTable();
        this.applyCapturedBoardToTable();
    }
}
window.addEventListener("DOMContentLoaded", () => {
    const shogiBoardTbodyElement = document.getElementById('shogiBoard');
    const senteTbodyElement = document.getElementById('senteBoard');
    const goteTbodyElement = document.getElementById('goteBoard');
    if (shogiBoardTbodyElement) {
        new ShogiUI(shogiBoardTbodyElement, senteTbodyElement, goteTbodyElement);
    }
    else {
        console.error("Shogi board table not found.");
    }
});
//# sourceMappingURL=shogiUI.js.map