import InvalidParametersError, {
  BOARD_POSITION_NOT_EMPTY_MESSAGE,
  GAME_FULL_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  GAME_OVER_MESSAGE,
  INVALID_MOVE_MESSAGE,
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
    });
  }

  private _board = [
    ['', '', ''],
    ['', '', ''],
    ['', '', ''],
  ];

  private _previouslyPlayedPlayer = '';

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
    const { status, moves, x } = this.state;

    // validate if game is over
    if (status === 'OVER' || this.state.winner !== undefined) {
      throw new InvalidParametersError(GAME_OVER_MESSAGE);
    }

    // Validate if the game is in progress
    if (status === 'WAITING_TO_START') {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }

    // check for invalid move with wrong row or column position
    if (
      move.move.row < 0 ||
      move.move.row >= this._board.length ||
      move.move.col < 0 ||
      move.move.col >= this._board[0].length
    ) {
      throw new InvalidParametersError(INVALID_MOVE_MESSAGE);
    }

    if (this._previouslyPlayedPlayer === '') {
      this._previouslyPlayedPlayer = move.playerID;
    } else if (move.playerID === this._previouslyPlayedPlayer) {
      throw new InvalidParametersError(MOVE_NOT_YOUR_TURN_MESSAGE);
    } else {
      this._previouslyPlayedPlayer = move.playerID;
    }

    // Validate if it's the player's turn
    const currentPlayer = this._players.find(player => player.id === move.playerID);
    if (currentPlayer && moves.length % 2 === 0 && move.move.gamePiece !== 'X') {
      throw new InvalidParametersError(MOVE_NOT_YOUR_TURN_MESSAGE);
    } else if (moves.length % 2 !== 0 && move.move.gamePiece !== 'O') {
      throw new InvalidParametersError(MOVE_NOT_YOUR_TURN_MESSAGE);
    }

    // Validate if the selected position is empty
    const selectedPosition = this._board[move.move.row][move.move.col];
    if (selectedPosition !== '') {
      throw new InvalidParametersError(BOARD_POSITION_NOT_EMPTY_MESSAGE);
    }

    // Determine the game piece based on the player's ID
    const gamePiece = currentPlayer && currentPlayer.id === x ? 'X' : 'O';

    // Apply the move to the game
    this._board[move.move.row][move.move.col] = gamePiece;
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
    if (this.state.status === 'OVER' || this.state.winner !== undefined) {
      throw new InvalidParametersError(GAME_OVER_MESSAGE);
    }
    if (this._players.some(p => p.id === player.id)) {
      throw new InvalidParametersError(PLAYER_ALREADY_IN_GAME_MESSAGE);
    }
    // previously=> if(this._players.length >= 2)
    if (this.state.x && this.state.o) {
      throw new InvalidParametersError(GAME_FULL_MESSAGE);
    }

    if (!this.state.x) {
      this.state.x = player.id;
    } else {
      this.state.o = player.id;
      this.state.status = 'IN_PROGRESS';
    }
    // if (this._players.length === 0 && this.state.status === 'WAITING_TO_START') {
    //   // first player joins
    //   this.state.x = player.id;
    // } else if (this._players.length === 1 && this.state.status === 'WAITING_TO_START') {
    //   // second player joins
    //   this.state.o = player.id;
    //   // both players are added then we can start the game
    //   this.state.status = 'IN_PROGRESS';
    // }

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
      this._board[row][0] === gamePiece &&
      this._board[row][1] === gamePiece &&
      this._board[row][2] === gamePiece
    ) {
      return true;
    }

    // Check column
    if (
      this._board[0][col] === gamePiece &&
      this._board[1][col] === gamePiece &&
      this._board[2][col] === gamePiece
    ) {
      return true;
    }

    // Check diagonals
    if (
      (row === col || row + col === 2) &&
      ((this._board[0][0] === gamePiece &&
        this._board[1][1] === gamePiece &&
        this._board[2][2] === gamePiece) ||
        (this._board[0][2] === gamePiece &&
          this._board[1][1] === gamePiece &&
          this._board[2][0] === gamePiece))
    ) {
      return true;
    }

    return false;
  }

  private _checkForDraw(): boolean {
    for (const row of this._board) {
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
    this.state = {
      moves: [],
      status: 'WAITING_TO_START',
    };

    this._board = [
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
    ];
  }
}
