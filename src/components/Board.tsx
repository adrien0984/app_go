/**
 * Composant Board - Plateau Go interactif 19×19
 * Canvas API avec 7 layers de rendu, 60 FPS, responsive
 * @component
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/store';
import { addMove, undoMove, nextMove, previousMove } from '@/store/slices/gameSlice';
import { GameService } from '@/services/GameService';
import {
  drawBackground,
  drawGrid,
  drawHoshi,
  drawStones,
  drawMoveNumbers,
  drawHighlights,
  drawHover,
  drawPolicyHeatmap,
} from '@/utils/canvasUtils';
import { pixelToGoCoord, calculateCanvasSize } from '@/utils/boardUtils';
import type { Position } from '@/types/game';
import './Board.css';

export interface BoardProps {
  className?: string;
  /** Distribution policy NN 19×19 pour affichage heatmap */
  policy?: number[][] | null;
  /** Activer/désactiver la heatmap policy */
  showHeatmap?: boolean;
}

/**
 * Composant Board interactif 19×19
 * Gère : rendu canvas, interactions utilisateur, état plateau
 *
 * Features:
 * - Canvas 19×19 avec pipeline 7 layers
 * - 60 FPS avec requestAnimationFrame
 * - Responsive (360px - 800px)
 * - Support souris + tactile
 * - Navigation clavier (flèches + Enter)
 * - Undo/Redo (Ctrl+Z)
 *
 * @component
 * @example
 * <Board className="my-board" />
 */
export const Board: React.FC<BoardProps> = ({ className = '', policy = null, showHeatmap = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);

  // State local
  const [hoverPosition, setHoverPosition] = useState<Position | null>(null);
  const [canvasSize, setCanvasSize] = useState(760);
  const [keyboardCursor, setKeyboardCursor] = useState<Position | null>(null);

  // Redux
  const dispatch = useDispatch();
  const game = useSelector((state: RootState) => state.game.current);
  const currentMoveIndex = useSelector(
    (state: RootState) => state.game.currentMoveIndex
  );

  /**
   * Effet : Responsive sizing avec ResizeObserver
   * Met à jour canvas.width/height et cellSize sur resize
   */
  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;
      const size = calculateCanvasSize(width, height);
      setCanvasSize(size);

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = size;
        canvas.height = size;
      }
    };

    // Initial sizing
    updateSize();

    // ResizeObserver pour responsive
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  /**
   * Effet : Keyboard shortcuts (Ctrl+Z, Flèches, Enter)
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!game) return;

      // Ctrl+Z : Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        dispatch(undoMove());
        return;
      }

      // Flèches : Naviguer dans l'historique
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        dispatch(previousMove());
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        dispatch(nextMove());
        return;
      }

      // Navigation clavier sur le plateau : Flèches + Enter
      // Arrow Up : ligne précédente (y-1)
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (keyboardCursor) {
          setKeyboardCursor({
            x: keyboardCursor.x,
            y: Math.max(0, keyboardCursor.y - 1),
          });
        } else {
          setKeyboardCursor({ x: 9, y: 8 }); // Commencer au centre
        }
        return;
      }

      // Arrow Down : ligne suivante (y+1)
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (keyboardCursor) {
          setKeyboardCursor({
            x: keyboardCursor.x,
            y: Math.min(18, keyboardCursor.y + 1),
          });
        } else {
          setKeyboardCursor({ x: 9, y: 10 });
        }
        return;
      }

      // Enter : Jouer coup à la position du clavier
      if (e.key === 'Enter' && keyboardCursor) {
        e.preventDefault();
        if (!GameService.isValidMove(game, keyboardCursor)) {
          console.warn('Coup invalide (clavier) :', keyboardCursor);
          return;
        }
        dispatch(addMove(keyboardCursor));
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, keyboardCursor, game]);

  /**
   * Render loop : requestAnimationFrame avec 7 layers
   * Perf target : < 16ms per frame (60 FPS)
   */
  useEffect(() => {
    if (!game) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const cellSize = canvasSize / 20; // 19 intersections + 2 marges = 20 cellules
    const moves = game.rootMoves.slice(0, currentMoveIndex + 1);
    const lastMove = moves.length > 0 ? moves[moves.length - 1] : null;
    const nextColor = GameService.getNextColor(game);

    /**
     * Fonction de rendu enchaînant les 7 layers
     */
    const render = () => {
      // Layer 0 : Clear
      ctx.clearRect(0, 0, canvasSize, canvasSize);

      // Layers 1-7
      drawBackground(ctx, canvasSize);
      drawGrid(ctx, canvasSize, cellSize);
      drawHoshi(ctx, cellSize);

      // Layer 8 (optionnel) : Heatmap policy
      if (showHeatmap && policy) {
        drawPolicyHeatmap(ctx, policy, cellSize, moves);
      }

      drawStones(ctx, moves, cellSize);
      drawMoveNumbers(ctx, moves, cellSize);
      drawHighlights(ctx, lastMove, cellSize);
      drawHover(ctx, hoverPosition, cellSize, nextColor);

      // Schedule next frame
      rafIdRef.current = requestAnimationFrame(render);
    };

    // Start rendering
    render();

    // Cleanup
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [game, currentMoveIndex, hoverPosition, canvasSize, policy, showHeatmap]);

  /**
   * Handler : Click sur intersection
   * Valide et ajoute coup via Redux
   */
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!game || !canvasRef.current) return;

      const position = pixelToGoCoord(e, canvasRef.current, canvasSize);
      if (!position) {
        console.warn('Click hors plateau');
        return;
      }

      // Validation basique
      if (!GameService.isValidMove(game, position)) {
        console.warn('Coup invalide :', position);
        return;
      }

      // Dispatch action Redux
      dispatch(addMove(position));
    },
    [game, canvasSize, dispatch]
  );

  /**
   * Handler : Mouse move pour hover feedback
   */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;

      const position = pixelToGoCoord(e, canvasRef.current, canvasSize);
      setHoverPosition(position);
    },
    [canvasSize]
  );

  /**
   * Handler : Mouse leave
   */
  const handleMouseLeave = useCallback(() => {
    setHoverPosition(null);
  }, []);

  /**
   * Handler : Touch support
   */
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!game || !canvasRef.current || e.touches.length === 0) return;

      const position = pixelToGoCoord(e, canvasRef.current, canvasSize);
      if (!position) return;

      if (!GameService.isValidMove(game, position)) {
        console.warn('Coup invalide (touch) :', position);
        return;
      }

      dispatch(addMove(position));
    },
    [game, canvasSize, dispatch]
  );

  if (!game) {
    return (
      <div className={`board-container ${className}`}>
        <p className="board-placeholder">Créez une partie pour commencer</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`board-container ${className}`}
      role="region"
      aria-label="Plateau de jeu"
    >
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        className="board-canvas"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        style={{
          cursor: 'crosshair',
          display: 'block',
          margin: '0 auto',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        }}
        aria-label={`Plateau Go 19×19, ${game.rootMoves.length} coups joués`}
        role="img"
      />

      {/* UI Info Board */}
      <div className="board-info">
        <div className="board-status">
          <span className="status-text">
            Coup {currentMoveIndex + 1} / {game.rootMoves.length}
          </span>
          <span className="current-player">
            Tour : {GameService.getNextColor(game) === 'B' ? '⚫ Noir' : '⚪ Blanc'}
          </span>
        </div>

        {/* Controls */}
        <div className="board-controls">
          <button
            className="btn-nav"
            onClick={() => dispatch(previousMove())}
            disabled={currentMoveIndex <= -1}
            title="Coup précédent (Flèche gauche)"
            aria-label="Coup précédent"
          >
            ◀
          </button>

          <button
            className="btn-nav"
            onClick={() => dispatch(nextMove())}
            disabled={currentMoveIndex >= game.rootMoves.length - 1}
            title="Coup suivant (Flèche droite)"
            aria-label="Coup suivant"
          >
            ▶
          </button>

          <button
            className="btn-action"
            onClick={() => dispatch(undoMove())}
            disabled={game.rootMoves.length === 0}
            title="Annuler dernier coup (Ctrl+Z)"
            aria-label="Annuler"
          >
            ↶ Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default Board;
