/**
 * Tests unitaires pour le composant VariationViewer
 * @module tests/unit/VariationViewer.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import VariationViewer from '@/components/VariationViewer';
import type { AnalysisVariation } from '@/types/katago';

// Configuration i18n pour les tests
const testI18n = i18n.createInstance();
testI18n.init({
  lng: 'en',
  ns: ['analysis', 'common'],
  defaultNS: 'analysis',
  resources: {
    en: {
      analysis: {
        variationViewer: 'Variation Viewer',
        variationTitle: 'Estimated Game Line (PV)',
        variationInvalid: 'Invalid or unavailable variation',
        variationKeyboardHelp: 'Use ← → to navigate, Escape to close',
        totalMoves: 'Moves',
        avgWinrate: 'Average Rate',
        maxWinrate: 'Best',
        minWinrate: 'Worst',
        prevMove: 'Previous Move',
        nextMove: 'Next Move',
        prev: 'Previous',
        next: 'Next',
      },
      common: {
        close: 'Close',
        black: 'Black',
        white: 'White',
      },
    },
  },
});

// Données de test
const mockVariation: AnalysisVariation = {
  mainMove: { x: 3, y: 16 },
  pv: [
    { x: 3, y: 16 },
    { x: 16, y: 3 },
    { x: 3, y: 3 },
    { x: 16, y: 16 },
    { x: 9, y: 9 },
  ],
  pvWinrates: [0.62, 0.61, 0.62, 0.63, 0.60],
  pvScores: [2.5, 2.3, 2.2, 2.1, 2.0],
};

const renderComponent = (props = {}) => {
  const defaultProps = {
    variation: mockVariation,
    onClose: vi.fn(),
    onMoveClick: vi.fn(),
    positionToSGF: (pos: any) => {
      const letters = 'abcdefghijklmnopqrs';
      return `${letters[pos.x]}${pos.y + 1}`;
    },
  };

  return render(
    <I18nextProvider i18n={testI18n}>
      <VariationViewer {...defaultProps} {...props} />
    </I18nextProvider>
  );
};

describe('VariationViewer', () => {
  describe('Rendering', () => {
    it('should render the variation viewer with title', () => {
      renderComponent();
      expect(screen.getByText('Estimated Game Line (PV)')).toBeInTheDocument();
    });

    it('should display stats section with correct values', () => {
      renderComponent();
      expect(screen.getByText('5')).toBeInTheDocument(); // totalMoves
      expect(screen.getByText('61.6%')).toBeInTheDocument(); // avgWinrate
      expect(screen.getByText('63.0%')).toBeInTheDocument(); // maxWinrate
      expect(screen.getByText('60.0%')).toBeInTheDocument(); // minWinrate
    });

    it('should render all moves in the variation', () => {
      renderComponent();
      const moves = screen.getAllByRole('option');
      expect(moves).toHaveLength(mockVariation.pv.length);
    });

    it('should show position info with counters', () => {
      renderComponent();
      expect(screen.getByText('1 / 5')).toBeInTheDocument();
      expect(screen.getByText('62.0%')).toBeInTheDocument(); // winrate of first move
    });

    it('should render close button', () => {
      renderComponent();
      const closeBtn = screen.getByLabelText('Close');
      expect(closeBtn).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to next move with Next button', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const nextBtn = screen.getByText('Next →');
      await user.click(nextBtn);
      
      expect(screen.getByText('2 / 5')).toBeInTheDocument();
      expect(screen.getByText('61.0%')).toBeInTheDocument(); // winrate of second move
    });

    it('should navigate to previous move with Previous button', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const nextBtn = screen.getByText('Next →');
      await user.click(nextBtn);
      
      const prevBtn = screen.getByText('← Previous');
      await user.click(prevBtn);
      
      expect(screen.getByText('1 / 5')).toBeInTheDocument();
    });

    it('should disable Previous button at start', () => {
      renderComponent();
      const prevBtn = screen.getByText('← Previous');
      expect(prevBtn).toHaveAttribute('disabled');
    });

    it('should disable Next button at end', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Navigate to last move
      const nextBtn = screen.getByText('Next →');
      for (let i = 0; i < 4; i++) {
        await user.click(nextBtn);
      }
      
      expect(nextBtn).toHaveAttribute('disabled');
    });

    it('should navigate with arrow keys', async () => {
      const user = userEvent.setup();
      const { container } = renderComponent();
      
      const viewer = container.querySelector('.variation-viewer');
      await user.click(viewer!); // Focus the viewer
      
      // Right arrow
      fireEvent.keyDown(viewer!, { key: 'ArrowRight' });
      expect(screen.getByText('2 / 5')).toBeInTheDocument();
      
      // Left arrow
      fireEvent.keyDown(viewer!, { key: 'ArrowLeft' });
      expect(screen.getByText('1 / 5')).toBeInTheDocument();
    });

    it('should close on Escape key', async () => {
      const onClose = vi.fn();
      const { container } = renderComponent({ onClose });
      
      const viewer = container.querySelector('.variation-viewer');
      fireEvent.keyDown(viewer!, { key: 'Escape' });
      
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Move selection', () => {
    it('should select move when clicking on it', async () => {
      const user = userEvent.setup();
      const onMoveClick = vi.fn();
      renderComponent({ onMoveClick });
      
      const moves = screen.getAllByRole('option');
      await user.click(moves[2]);
      
      expect(onMoveClick).toHaveBeenCalledWith(2, mockVariation.pv[2]);
    });

    it('should highlight selected move', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const moves = screen.getAllByRole('option');
      await user.click(moves[2]);
      
      expect(moves[2]).toHaveClass('selected');
      expect(moves[0]).not.toHaveClass('selected');
    });
  });

  describe('Close button', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderComponent({ onClose });
      
      const closeBtn = screen.getByLabelText('Close');
      await user.click(closeBtn);
      
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Move display', () => {
    it('should display move coordinates in SGF notation', () => {
      renderComponent();
      expect(screen.getByText('d17')).toBeInTheDocument(); // (3, 16)
      expect(screen.getByText('q4')).toBeInTheDocument(); // (16, 3)
    });

    it('should display winrates for each move', () => {
      renderComponent();
      expect(screen.getByText('62.0%')).toBeInTheDocument();
      expect(screen.getByText('61.0%')).toBeInTheDocument();
      expect(screen.getByText('63.0%')).toBeInTheDocument();
    });

    it('should display scores if provided', () => {
      renderComponent();
      expect(screen.getByText('+2.5')).toBeInTheDocument();
      expect(screen.getByText('+2.3')).toBeInTheDocument();
    });
  });

  describe('Invalid variation handling', () => {
    it('should display error message for invalid variation', () => {
      const invalidVariation = {
        mainMove: { x: 3, y: 16 },
        pv: [],
        pvWinrates: [],
      };
      
      renderComponent({ variation: invalidVariation });
      expect(screen.getByText('Invalid or unavailable variation')).toBeInTheDocument();
    });

    it('should call onClose button in error state', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const invalidVariation = {
        mainMove: { x: 3, y: 16 },
        pv: [],
        pvWinrates: [],
      };
      
      renderComponent({ variation: invalidVariation, onClose });
      const closeBtn = screen.getByLabelText('Close');
      await user.click(closeBtn);
      
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Stats calculation', () => {
    it('should correctly calculate average winrate', () => {
      // (0.62 + 0.61 + 0.62 + 0.63 + 0.60) / 5 = 0.616 = 61.6%
      renderComponent();
      expect(screen.getByText('61.6%')).toBeInTheDocument();
    });

    it('should correctly identify max winrate', () => {
      renderComponent();
      expect(screen.getByText('63.0%')).toBeInTheDocument();
    });

    it('should correctly identify min winrate', () => {
      renderComponent();
      expect(screen.getByText('60.0%')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderComponent();
      expect(screen.getByRole('region')).toHaveAttribute(
        'aria-label',
        'Variation Viewer'
      );
    });

    it('should have listbox role for moves', () => {
      renderComponent();
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('should have proper ARIA labels on move buttons', () => {
      const { container } = renderComponent();
      const moves = container.querySelectorAll('.variation-move');
      
      expect(moves[0]).toHaveAttribute('aria-label');
      expect(moves[0].getAttribute('aria-label')).toContain('Black');
    });
  });
});
