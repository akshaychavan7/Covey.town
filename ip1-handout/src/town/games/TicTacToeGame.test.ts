import { createPlayerForTesting } from '../../TestUtils';
import {
  BOARD_POSITION_NOT_EMPTY_MESSAGE,
  GAME_FULL_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  GAME_OVER_MESSAGE,
  MOVE_NOT_YOUR_TURN_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import { TicTacToeMove } from '../../types/CoveyTownSocket';
import TicTacToeGame from './TicTacToeGame';

describe('TicTacToeGame', () => {
  let game: TicTacToeGame;

  beforeEach(() => {
    game = new TicTacToeGame();
  });

  describe('[T1.3] game start', () => {
    describe('When the game has just started', () => {
      it('when no player has joined yet', () => {
        expect(game.state.status).toEqual('WAITING_TO_START');
        expect(game.state.x).toBeUndefined();
        expect(game.state.o).toBeUndefined();
        expect(game.state.moves).toHaveLength(0);
        expect(game.state.winner).toBeUndefined();
      });
    });
  });

  describe('[T1.1] _join', () => {
    describe('When the player can be added', () => {
      it('makes the first player X and initializes the state with status WAITING_TO_START', () => {
        const player = createPlayerForTesting();
        game.join(player);
        expect(game.state.x).toEqual(player.id);
        expect(game.state.o).toBeUndefined();
        expect(game.state.moves).toHaveLength(0);
        expect(game.state.status).toEqual('WAITING_TO_START');
        expect(game.state.winner).toBeUndefined();
      });

      it('adds the second player as O and updates the status to IN_PROGRESS', () => {
        const player1 = createPlayerForTesting();
        const player2 = createPlayerForTesting();

        game.join(player1);
        game.join(player2);

        expect(game.state.x).toEqual(player1.id);
        expect(game.state.o).toEqual(player2.id);
        expect(game.state.status).toEqual('IN_PROGRESS');
      });

      it('throws an error if the game is already full', () => {
        const player1 = createPlayerForTesting();
        const player2 = createPlayerForTesting();
        const player3 = createPlayerForTesting();

        game.join(player1);
        game.join(player2);

        expect(() => game.join(player3)).toThrowError(GAME_FULL_MESSAGE);
      });

      it('throws an error if the game is already over and player tries to join', () => {
        const player1 = createPlayerForTesting();
        const player2 = createPlayerForTesting();
        const player3 = createPlayerForTesting();

        game.join(player1);
        game.join(player2);
        game.leave(player2);

        expect(() => game.join(player3)).toThrowError(GAME_OVER_MESSAGE);
      });

      it('throws an error if the player is already in the game', () => {
        const player = createPlayerForTesting();

        game.join(player);

        expect(() => game.join(player)).toThrowError(PLAYER_ALREADY_IN_GAME_MESSAGE);
      });
    });

    describe('[T1.2] _leave', () => {
      describe('when the player is in the game', () => {
        describe('when the game is in progress, it should set the game status to OVER and declare the other player the winner', () => {
          test('when x leaves', () => {
            const player1 = createPlayerForTesting();
            const player2 = createPlayerForTesting();
            game.join(player1);
            game.join(player2);
            expect(game.state.x).toEqual(player1.id);
            expect(game.state.o).toEqual(player2.id);

            game.leave(player1);

            expect(game.state.status).toEqual('OVER');
            expect(game.state.winner).toEqual(player2.id);
            expect(game.state.moves).toHaveLength(0);

            expect(game.state.x).toEqual(player1.id);
            expect(game.state.o).toEqual(player2.id);
          });

          test('when O leaves', () => {
            const player1 = createPlayerForTesting();
            const player2 = createPlayerForTesting();
            game.join(player1);
            game.join(player2);
            expect(game.state.x).toEqual(player1.id);
            expect(game.state.o).toEqual(player2.id);

            game.leave(player2);

            expect(game.state.status).toEqual('OVER');
            expect(game.state.winner).toEqual(player1.id);
            expect(game.state.moves).toHaveLength(0);

            expect(game.state.x).toEqual(player1.id);
            expect(game.state.o).toEqual(player2.id);
          });

          test('when X leaves before O joins', () => {
            const player1 = createPlayerForTesting();
            const player2 = createPlayerForTesting();
            game.join(player1);
            game.leave(player1);
            game.join(player2);
            expect(game.state.x).toEqual(player2.id);

            expect(game.state.status).toEqual('WAITING_TO_START');
            expect(game.state.moves).toHaveLength(0);
          });

          it('removes the player and sets the status to OVER if only one player remains', () => {
            const player1 = createPlayerForTesting();
            const player2 = createPlayerForTesting();

            game.join(player1);
            game.join(player2);

            game.leave(player2);

            expect(game.state.status).toEqual('OVER');
            expect(game.state.x).toEqual(player1.id);
            expect(game.state.o).toEqual(player2.id);
          });

          it('sets the status to OVER and declares the other player the winner if the game is in progress', () => {
            const player1 = createPlayerForTesting();
            const player2 = createPlayerForTesting();

            game.join(player1);
            game.join(player2);

            game.leave(player1);

            expect(game.state.status).toEqual('OVER');
            expect(game.state.winner).toEqual(player2.id);
          });

          it('throws an error if the player is not in the game', () => {
            const player1 = createPlayerForTesting();
            const player2 = createPlayerForTesting();
            const player3 = createPlayerForTesting();

            game.join(player1);
            game.join(player2);

            expect(() => game.leave(player3)).toThrowError(PLAYER_NOT_IN_GAME_MESSAGE);
          });
        });
      });
    });

    describe('Player Joining and Leaving', () => {
      // Test scenarios related to player joining and leaving

      it('allows two players to join and start a new game', () => {
        const player1 = createPlayerForTesting();
        const player2 = createPlayerForTesting();

        game.join(player1);
        game.join(player2);

        expect(game.state.x).toEqual(player1.id);
        expect(game.state.o).toEqual(player2.id);
        expect(game.state.status).toEqual('IN_PROGRESS');
      });

      it('throws an error if a third player attempts to join', () => {
        const player1 = createPlayerForTesting();
        const player2 = createPlayerForTesting();
        const player3 = createPlayerForTesting();

        game.join(player1);
        game.join(player2);

        expect(() => game.join(player3)).toThrowError(GAME_FULL_MESSAGE);
      });

      it('throws an error if a player attempts to join the same game twice', () => {
        const player = createPlayerForTesting();

        game.join(player);

        expect(() => game.join(player)).toThrowError(PLAYER_ALREADY_IN_GAME_MESSAGE);
      });

      it('allows a player to leave, ending the game in a draw if no moves were made', () => {
        const player1 = createPlayerForTesting();
        const player2 = createPlayerForTesting();

        game.join(player1);
        game.join(player2);

        game.leave(player1);

        expect(game.state.status).toEqual('OVER');
        expect(game.state.winner).toEqual(player2.id);
        expect(game.state.moves).toHaveLength(0);
      });

      it('allows a player to leave, declaring the remaining player as the winner', () => {
        const player1 = createPlayerForTesting();
        const player2 = createPlayerForTesting();

        game.join(player1);
        game.join(player2);

        game.leave(player2);

        expect(game.state.status).toEqual('OVER');
        expect(game.state.winner).toEqual(player1.id);
      });
    });

    describe('applyMove', () => {
      describe('when given a valid move', () => {
        let player1: Player;
        let player2: Player;
        beforeEach(() => {
          player1 = createPlayerForTesting();
          player2 = createPlayerForTesting();
          game.join(player1);
          game.join(player2);
        });
        it('[T2.1] should add the move to the game state', () => {
          const move: TicTacToeMove = { row: 1, col: 2, gamePiece: 'X' };
          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move,
          });
          expect(game.state.moves).toHaveLength(1);
          expect(game.state.moves[0]).toEqual(move);
          expect(game.state.status).toEqual('IN_PROGRESS');
        });
        it('should switch turns between players after each valid move', () => {
          const move1: TicTacToeMove = { row: 1, col: 2, gamePiece: 'X' };
          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: move1,
          });

          const move2: TicTacToeMove = { row: 0, col: 0, gamePiece: 'O' };
          game.applyMove({
            gameID: game.id,
            playerID: player2.id,
            move: move2,
          });

          const move3: TicTacToeMove = { row: 2, col: 2, gamePiece: 'X' };
          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: move3,
          });

          expect(game.state.moves).toHaveLength(3);
          expect(game.state.moves[0]).toEqual(move1);
          expect(game.state.moves[1]).toEqual(move2);
          expect(game.state.moves[2]).toEqual(move3);
          expect(game.state.status).toEqual('IN_PROGRESS');
        });

        it('should correctly detect a winning move and end the game', () => {
          // Player 1 makes winning moves
          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: { row: 0, col: 0, gamePiece: 'X' },
          });

          game.applyMove({
            gameID: game.id,
            playerID: player2.id,
            move: { row: 1, col: 1, gamePiece: 'O' },
          });

          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: { row: 0, col: 1, gamePiece: 'X' },
          });

          game.applyMove({
            gameID: game.id,
            playerID: player2.id,
            move: { row: 1, col: 0, gamePiece: 'O' },
          });

          // Player 1 wins with the next move
          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: { row: 0, col: 2, gamePiece: 'X' },
          });

          expect(game.state.status).toEqual('OVER');
          expect(game.state.winner).toEqual(player1.id);
        });

        it('should correctly detect a win for X', () => {
          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: { row: 0, col: 0, gamePiece: 'X' },
          });

          game.applyMove({
            gameID: game.id,
            playerID: player2.id,
            move: { row: 0, col: 1, gamePiece: 'O' },
          });

          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: { row: 0, col: 2, gamePiece: 'X' },
          });

          game.applyMove({
            gameID: game.id,
            playerID: player2.id,
            move: { row: 1, col: 0, gamePiece: 'O' },
          });

          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: { row: 1, col: 1, gamePiece: 'X' },
          });

          game.applyMove({
            gameID: game.id,
            playerID: player2.id,
            move: { row: 1, col: 2, gamePiece: 'O' },
          });

          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: { row: 2, col: 0, gamePiece: 'X' },
          });

          expect(game.state.status).toEqual('OVER');
          expect(game.state.winner).toEqual(player1.id);
        });

        it('should correctly detect a draw and end the game', () => {
          // Filling the board with alternating moves, ends in a draw
          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: { row: 0, col: 0, gamePiece: 'X' },
          });

          game.applyMove({
            gameID: game.id,
            playerID: player2.id,
            move: { row: 0, col: 1, gamePiece: 'O' },
          });

          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: { row: 0, col: 2, gamePiece: 'X' },
          });

          game.applyMove({
            gameID: game.id,
            playerID: player2.id,
            move: { row: 1, col: 0, gamePiece: 'O' },
          });

          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: { row: 1, col: 1, gamePiece: 'X' },
          });

          game.applyMove({
            gameID: game.id,
            playerID: player2.id,
            move: { row: 2, col: 0, gamePiece: 'O' },
          });

          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: { row: 1, col: 2, gamePiece: 'X' },
          });

          game.applyMove({
            gameID: game.id,
            playerID: player2.id,
            move: { row: 2, col: 2, gamePiece: 'O' },
          });

          // Final move, resulting in a draw
          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: { row: 2, col: 1, gamePiece: 'X' },
          });

          expect(game.state.status).toEqual('OVER');
          expect(game.state.winner).toBeUndefined();
        });

        it('should throw an error if the move is on an occupied space', () => {
          const move1: TicTacToeMove = { row: 0, col: 0, gamePiece: 'X' };
          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: move1,
          });

          const move2: TicTacToeMove = { row: 0, col: 0, gamePiece: 'O' };

          expect(() =>
            game.applyMove({
              gameID: game.id,
              playerID: player2.id,
              move: move2,
            }),
          ).toThrowError(BOARD_POSITION_NOT_EMPTY_MESSAGE);
        });

        it("should throw an error if the move is not the player's turn", () => {
          const move1: TicTacToeMove = { row: 0, col: 0, gamePiece: 'X' };
          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: move1,
          });

          const move2: TicTacToeMove = { row: 0, col: 1, gamePiece: 'O' };
          game.applyMove({
            gameID: game.id,
            playerID: player2.id,
            move: move2,
          });

          const move3: TicTacToeMove = { row: 0, col: 2, gamePiece: 'X' };

          expect(() =>
            game.applyMove({
              gameID: game.id,
              playerID: player2.id, // Player 2's turn, but they try to make a move
              move: move3,
            }),
          ).toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);
        });

        it('should throw an error if the game is not in progress', () => {
          game.leave(player1);

          const move: TicTacToeMove = { row: 2, col: 2, gamePiece: 'O' };

          expect(() =>
            game.applyMove({
              gameID: game.id,
              playerID: player2.id,
              move,
            }),
          ).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
        });
        it('should correctly handle a draw if the move results in a tie', () => {
          // Filling the board to result in a draw
          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: { row: 0, col: 0, gamePiece: 'X' },
          });

          game.applyMove({
            gameID: game.id,
            playerID: player2.id,
            move: { row: 0, col: 1, gamePiece: 'O' },
          });

          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: { row: 0, col: 2, gamePiece: 'X' },
          });

          game.applyMove({
            gameID: game.id,
            playerID: player2.id,
            move: { row: 1, col: 0, gamePiece: 'O' },
          });

          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: { row: 1, col: 2, gamePiece: 'X' },
          });

          game.applyMove({
            gameID: game.id,
            playerID: player2.id,
            move: { row: 1, col: 1, gamePiece: 'O' },
          });

          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: { row: 2, col: 0, gamePiece: 'X' },
          });

          game.applyMove({
            gameID: game.id,
            playerID: player2.id,
            move: { row: 2, col: 2, gamePiece: 'O' },
          });

          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: { row: 2, col: 1, gamePiece: 'X' },
          });

          expect(game.state.status).toEqual('OVER');
          expect(game.state.winner).toBeUndefined();
        });

        it('should throw an error if the move is on an occupied space', () => {
          const move1: TicTacToeMove = { row: 0, col: 0, gamePiece: 'X' };
          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: move1,
          });

          const invalidMove: TicTacToeMove = { row: 0, col: 0, gamePiece: 'O' };

          expect(() =>
            game.applyMove({
              gameID: game.id,
              playerID: player2.id,
              move: invalidMove,
            }),
          ).toThrowError(BOARD_POSITION_NOT_EMPTY_MESSAGE);
        });

        it("should throw an error if the move is not the player's turn", () => {
          const move1: TicTacToeMove = { row: 0, col: 0, gamePiece: 'X' };
          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: move1,
          });

          const move2: TicTacToeMove = { row: 0, col: 1, gamePiece: 'O' };
          game.applyMove({
            gameID: game.id,
            playerID: player2.id,
            move: move2,
          });

          const invalidMove: TicTacToeMove = { row: 0, col: 2, gamePiece: 'X' };

          expect(() =>
            game.applyMove({
              gameID: game.id,
              playerID: player2.id, // Player 2's turn, but they try to make a move
              move: invalidMove,
            }),
          ).toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);
        });

        it('should throw an error if the game is not in progress', () => {
          game.leave(player1);

          const move: TicTacToeMove = { row: 2, col: 2, gamePiece: 'O' };

          expect(() =>
            game.applyMove({
              gameID: game.id,
              playerID: player2.id,
              move,
            }),
          ).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
        });
      });

      describe('when given an invalid move', () => {
        let player1: Player;
        let player2: Player;
        beforeEach(() => {
          player1 = createPlayerForTesting();
          player2 = createPlayerForTesting();
          game.join(player1);
          game.join(player2);
        });

        it('should throw an error if the game is not in progress', () => {
          game.leave(player1);
          const invalidMove: TicTacToeMove = { row: 0, col: 0, gamePiece: 'X' };

          expect(() =>
            game.applyMove({
              gameID: game.id,
              playerID: player1.id,
              move: invalidMove,
            }),
          ).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
        });

        it("should throw an error if it's not the player's turn", () => {
          const invalidMove: TicTacToeMove = { row: 0, col: 0, gamePiece: 'O' };

          expect(() =>
            game.applyMove({
              gameID: game.id,
              playerID: player1.id,
              move: invalidMove,
            }),
          ).toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);
        });

        it('should throw an error if the selected position is already occupied', () => {
          const move1: TicTacToeMove = { row: 0, col: 0, gamePiece: 'X' };
          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: move1,
          });

          const invalidMove: TicTacToeMove = { row: 0, col: 0, gamePiece: 'O' };

          expect(() =>
            game.applyMove({
              gameID: game.id,
              playerID: player2.id,
              move: invalidMove,
            }),
          ).toThrowError(BOARD_POSITION_NOT_EMPTY_MESSAGE);
        });
      });
    });
  });
});
