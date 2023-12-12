import { isDataView } from 'util/types';
import InvalidParametersError, {
  BOARD_POSITION_NOT_EMPTY_MESSAGE,
  GAME_FULL_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  GAME_OVER_MESSAGE,
  MOVE_NOT_YOUR_TURN_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import { GameMove, TicTacToeGameState, TicTacToeMove } from '../../types/CoveyTownSocket';
import Game from './Game';

/**
 * A TicTacToeGame is a Game that implements the rules of Tic Tac Toe.
 * @see https://en.wikipedia.org/wiki/Tic-tac-toe
 */
export default class TicTacToeGame extends Game<TicTacToeGameState, TicTacToeMove> {
  public constructor() {
    super({
      moves: [],
      status: 'WAITING_TO_START',
      board: [
        ['', '', ''],
        ['', '', ''],
        ['', '', ''],
      ],
    });
  }

  /*
   * Applies a player's move to the game.
   * Uses the player's ID to determine which game piece they are using (ignores move.gamePiece)
   * Validates the move before applying it. If the move is invalid, throws an InvalidParametersError with
   * the error message specified below.
   * A move is invalid if:
   *    - The move is on a space that is already occupied (use BOARD_POSITION_NOT_EMPTY_MESSAGE)
   *    - The move is not the player's turn (MOVE_NOT_YOUR_TURN_MESSAGE)
   *    - The game is not in progress (GAME_NOT_IN_PROGRESS_MESSAGE)
   *
   * If the move is valid, applies the move to the game and updates the game state.
   *
   * If the move ends the game, updates the game's state.
   * If the move results in a tie, updates the game's state to set the status to OVER and sets winner to undefined.
   * If the move results in a win, updates the game's state to set the status to OVER and sets the winner to the player who made the move.
   * A player wins if they have 3 in a row (horizontally, vertically, or diagonally).
   *
   * @param move The move to apply to the game
   * @throws InvalidParametersError if the move is invalid (with specific message noted above)
   */
  public applyMove(move: GameMove<TicTacToeMove>): void {
    const { status, moves, board, x } = this.state;

    // Validate if the game is in progress
    if (status !== 'IN_PROGRESS') {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }

    // Validate if it's the player's turn
    const currentPlayerIndex = moves.length % this._players.length;
    const currentPlayer = this._players[currentPlayerIndex];

    const isValidMove =
      (currentPlayerIndex === 0 && move.move.gamePiece === 'O') ||
      (currentPlayerIndex === 1 && move.move.gamePiece === 'X') ||
      currentPlayer.id !== move.playerID;

    if (isValidMove) {
      throw new InvalidParametersError(MOVE_NOT_YOUR_TURN_MESSAGE);
    }

    // Validate if the selected position is empty
    const selectedPosition = board[move.move.row][move.move.col];
    if (selectedPosition !== '') {
      throw new InvalidParametersError(BOARD_POSITION_NOT_EMPTY_MESSAGE);
    }

    // Determine the game piece based on the player's ID
    const gamePiece = currentPlayer.id === x ? 'X' : 'O';

    // Apply the move to the game
    this.state.board[move.move.row][move.move.col] = gamePiece;
    this.state = {
      ...this.state,
      moves: [...this.state.moves, move.move],
    };

    // Check if the move resulted in a win
    if (this._checkForWin(move.move.row, move.move.col, gamePiece)) {
      this.state.status = 'OVER';
      this.state.winner = move.playerID;
    }

    // Check if the move resulted in a draw
    if (this._checkForDraw()) {
      this.state.status = 'OVER';
      this.state.winner = undefined;
    }
  }

  /**
   * Adds a player to the game.
   * Updates the game's state to reflect the new player.
   * If the game is now full (has two players), updates the game's state to set the status to IN_PROGRESS.
   *
   * @param player The player to join the game
   * @throws InvalidParametersError if the player is already in the game (PLAYER_ALREADY_IN_GAME_MESSAGE)
   *  or the game is full (GAME_FULL_MESSAGE)
   */
  protected _join(player: Player): void {
    if (this._players.length >= 2) {
      throw new InvalidParametersError(GAME_FULL_MESSAGE);
    }

    if (this._players.some(p => p.id === player.id)) {
      throw new InvalidParametersError(PLAYER_ALREADY_IN_GAME_MESSAGE);
    }

    if (this.state.status === 'OVER') {
      throw new InvalidParametersError(GAME_OVER_MESSAGE);
    }

    if (this._players.length === 0 && this.state.status === 'WAITING_TO_START') {
      // first player joins
      this.state.x = player.id;
    } else if (this._players.length === 1 && this.state.status === 'WAITING_TO_START') {
      // second player joins
      this.state.o = player.id;
      // both players are added then we can start the game
      this.state.status = 'IN_PROGRESS';
    }

    // this._players.push(player); // the player is already being pushed inside Game class join method
  }

  /**
   * Removes a player from the game.
   * Updates the game's state to reflect the player leaving.
   * If the game has two players in it at the time of call to this method,
   *   updates the game's status to OVER and sets the winner to the other player.
   * If the game does not yet have two players in it at the time of call to this method,
   *   updates the game's status to WAITING_TO_START.
   *
   * @param player The player to remove from the game
   * @throws InvalidParametersError if the player is not in the game (PLAYER_NOT_IN_GAME_MESSAGE)
   */
  protected _leave(player: Player): void {
    if (!this._players.some(p => p.id === player.id)) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }

    // remove player
    this._players = this._players.filter(p => p.id !== player.id); // player is already being removed in Game class

    if (this._players.length === 1 && this.state.status === 'IN_PROGRESS') {
      // if only one player is left, then end the game and other player is winner
      this.state.status = 'OVER';
      this.state.winner = this._players[0].id;
    } else if (this._players.length === 0) {
      // only one player had joined and he also left, no players remaining
      this.state.status = 'WAITING_TO_START';
      this.state.x = undefined;
      this.state.o = undefined;
    }
  }

  private _checkForWin(row: number, col: number, gamePiece: string): boolean {
    // Check row
    if (
      this.state.board[row][0] === gamePiece &&
      this.state.board[row][1] === gamePiece &&
      this.state.board[row][2] === gamePiece
    ) {
      return true;
    }

    // Check column
    if (
      this.state.board[0][col] === gamePiece &&
      this.state.board[1][col] === gamePiece &&
      this.state.board[2][col] === gamePiece
    ) {
      return true;
    }

    // Check diagonals
    if (
      (row === col || row + col === 2) &&
      ((this.state.board[0][0] === gamePiece &&
        this.state.board[1][1] === gamePiece &&
        this.state.board[2][2] === gamePiece) ||
        (this.state.board[0][2] === gamePiece &&
          this.state.board[1][1] === gamePiece &&
          this.state.board[2][0] === gamePiece))
    ) {
      return true;
    }

    return false;
  }

  private _checkForDraw(): boolean {
    for (const row of this.state.board) {
      if (row.some(cell => cell === '')) {
        return false;
      }
    }
    return true;
  }

  public get players(): Player[] {
    return this._players;
  }

  public end(): void {
    // Add logic to end the game
    // For example, reset the game state
    this.state = {
      moves: [],
      status: 'WAITING_TO_START',
      board: [
        ['', '', ''],
        ['', '', ''],
        ['', '', ''],
      ],
    };
  }
}
