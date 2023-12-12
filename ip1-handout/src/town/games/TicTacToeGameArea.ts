import InvalidParametersError, {
  GAME_ID_MISSMATCH_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  INVALID_COMMAND_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import {
  GameMoveCommand,
  InteractableCommand,
  InteractableCommandReturnType,
  InteractableType,
  JoinGameCommand,
  LeaveGameCommand,
  TicTacToeMove,
} from '../../types/CoveyTownSocket';
import GameArea from './GameArea';
import TicTacToeGame from './TicTacToeGame';

/**
 * A TicTacToeGameArea is a GameArea that hosts a TicTacToeGame.
 * @see TicTacToeGame
 * @see GameArea
 */
export default class TicTacToeGameArea extends GameArea<TicTacToeGame> {
  protected getType(): InteractableType {
    return 'TicTacToeArea';
  }

  /**
   * Handle a command from a player in this game area.
   * Supported commands:
   * - JoinGame (joins the game `this._game`, or creates a new one if none is in progress)
   * - GameMove (applies a move to the game)
   * - LeaveGame (leaves the game)
   *
   * If the command ended the game, records the outcome in this._history
   * If the command is successful (does not throw an error), calls this._emitAreaChanged (necessary
   *  to notify any listeners of a state update, including any change to history)
   * If the command is unsuccessful (throws an error), the error is propagated to the caller
   *
   * @see InteractableCommand
   *
   * @param command command to handle
   * @param player player making the request
   * @returns response to the command, @see InteractableCommandResponse
   * @throws InvalidParametersError if the command is not supported or is invalid. Invalid commands:
   *  - LeaveGame and GameMove: No game in progress (GAME_NOT_IN_PROGRESS_MESSAGE),
   *        or gameID does not match the game in progress (GAME_ID_MISSMATCH_MESSAGE)
   *  - Any command besides LeaveGame, GameMove and JoinGame: INVALID_COMMAND_MESSAGE
   */
  public handleCommand<CommandType extends InteractableCommand>(
    command: CommandType,
    player: Player,
  ): InteractableCommandReturnType<CommandType> {
    switch (command.type) {
      case 'JoinGame':
        return this._handleJoinGame(player) as InteractableCommandReturnType<CommandType>;
      case 'GameMove':
        return this._handleGameMove(
          player,
          command as GameMoveCommand<TicTacToeMove>,
        ) as InteractableCommandReturnType<CommandType>;
      case 'LeaveGame':
        return this._handleLeaveGame(
          player,
          command as LeaveGameCommand,
        ) as InteractableCommandReturnType<CommandType>;
      default:
        throw new InvalidParametersError(INVALID_COMMAND_MESSAGE);
    }
  }

  private _handleJoinGame(
    player: Player,
  ): InteractableCommandReturnType<JoinGameCommand> | { gameID: string } {
    if (!this._game) {
      // If no game in progress, create a new game and join it
      const newGame = new TicTacToeGame();
      newGame.join(player);
      return { gameID: newGame.id };
    }

    // If a game is already in progress, join the existing game
    this._game.join(player);
    this._emitAreaChanged();
    return { gameID: this._game.id };
  }

  private _handleGameMove(
    player: Player,
    command: GameMoveCommand<TicTacToeMove>,
  ): InteractableCommandReturnType<GameMoveCommand<TicTacToeMove>> {
    if (!this._game) {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }

    this._game.applyMove({
      playerID: player.id,
      gameID: this._game.id,
      move: command.move,
    });

    this._emitAreaChanged();
    return undefined;
  }

  private _handleLeaveGame(
    player: Player,
    command: LeaveGameCommand,
  ): InteractableCommandReturnType<LeaveGameCommand> {
    if (!this._game) {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }

    if (command.gameID !== this._game.id) {
      throw new InvalidParametersError(GAME_ID_MISSMATCH_MESSAGE);
    }

    // Leave the game
    this._game.leave(player);

    // If there's only one player left in the game, end the game
    if (this._game.players.length === 1) {
      this._game.end();
    }

    this._emitAreaChanged();
    return undefined;
  }
}
