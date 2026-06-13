import type React from "react";
import type { CardState, HandCards, TurnPhase, TurnStateData } from "./boardStorage";

/**
 * Pointer-drag interaction logic for the player deck and player hand cards,
 * lifted out of Board.tsx. Each `make*` factory closes over a render-time
 * context object and the per-card identity, and returns the `onPointerDown`
 * handler. Keeping the logic here (rather than inline in Board's render) keeps
 * the heavy game-rule branching — deal-order routing, draw counting,
 * Share-Knowledge / Researcher takes — in one named, reviewable place; the JSX
 * stays in Board where the board-coordinate layout math lives.
 *
 * Behaviour is a verbatim move: handlers read `ctx.field` where they used to
 * read a closure variable of the same name.
 */

type BoardRef = React.RefObject<HTMLDivElement | null>;

/** Context for the face-down player-draw-pile top card. */
export interface DeckDrawCtx {
  boardRef: BoardRef;
  playerDeck: string[];
  playerDiscard: string[];
  cardPlayerDiscard: CardState;
  setup: unknown;            // truthy ⇒ game phase (vs. deal/calibrate)
  turnState: TurnStateData;
  handCards: HandCards;
  currentPlayerKey: string;
  onChooseRoles: ((playerCount: number) => void) | undefined; // truthy ⇒ deal phase
  maxDealTargetIdx: number;
  setPlayerDrag: (d: { cityId: string; x: number; y: number } | null) => void;
  setPlayerDeck: React.Dispatch<React.SetStateAction<string[]>>;
  setPlayerDiscard: React.Dispatch<React.SetStateAction<string[]>>;
  setPlayerFlipped: React.Dispatch<React.SetStateAction<Set<string>>>;
  saveTurnState: (next: TurnStateData) => void;
  saveHandCards: (next: HandCards) => void;
}

/**
 * Top-of-deck pointer handler: tap to flip; once flipped (face-up) drag to
 * discard or to a player's hand area. In draw phase it counts the draw and
 * advances the turn; in deal phase it enforces left-to-right deal order.
 */
export function makePlayerDeckDraw(ctx: DeckDrawCtx, cityId: string, faceUp: boolean) {
  return (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation(); e.preventDefault();
    const el = e.currentTarget; el.setPointerCapture(e.pointerId);
    const r = ctx.boardRef.current!.getBoundingClientRect();
    const startX = e.clientX; const startY = e.clientY;
    let moved = false;
    const deck = ctx.playerDeck; const disc = ctx.playerDiscard;
    const toPct = (ev: PointerEvent) => ({
      x: ((ev.clientX - r.left) / r.width) * 100,
      y: ((ev.clientY - r.top) / r.height) * 100,
    });
    const onMove = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) > 6) moved = true;
      if (moved) ctx.setPlayerDrag({ cityId, ...toPct(ev) });
    };
    const onUp = (ev: PointerEvent) => {
      el.removeEventListener("pointermove", onMove as EventListener);
      el.removeEventListener("pointerup", onUp);
      ctx.setPlayerDrag(null);
      if (!moved) {
        // tap = flip
        ctx.setPlayerFlipped(prev => {
          const n = new Set(prev);
          if (n.has(cityId)) n.delete(cityId); else n.add(cityId);
          return n;
        });
        return;
      }
      // dragged — allow drop to hand (face-down or face-up) or discard (face-up only)
      const pos = toPct(ev);
      const nearDiscard = Math.abs(pos.x - ctx.cardPlayerDiscard.x) < 10 && Math.abs(pos.y - ctx.cardPlayerDiscard.y) < 10;
      // Detect which of the 4 hand areas received the drop (2×2 layout, split at y=51)
      const leftSide = pos.x < 5; const rightSide = pos.x > 95; const topHalf = pos.y < 51;
      const droppedHand: string | null = leftSide ? (topHalf ? 'p1' : 'p3') : rightSide ? (topHalf ? 'p2' : 'p4') : null;
      const inDrawPhase = ctx.setup && ctx.turnState.phase === "draw" && faceUp;
      const completeOneDraw = () => {
        if (!inDrawPhase) return;
        const newCount = ctx.turnState.drawCount + 1;
        if (newCount >= 2) {
          // Check hand limit
          const hand = (ctx.handCards as Record<string,string[]>)[ctx.currentPlayerKey] ?? [];
          const phase: TurnPhase = (hand.length + (cityId !== "epidemic" ? 1 : 0)) > 7 ? "discard" : "infect";
          ctx.saveTurnState({ ...ctx.turnState, drawCount: newCount, phase, infectCount: 0 });
        } else {
          ctx.saveTurnState({ ...ctx.turnState, drawCount: newCount });
        }
      };
      if (faceUp && nearDiscard && !ctx.onChooseRoles) {
        ctx.setPlayerDeck(deck.slice(0, -1)); ctx.setPlayerDiscard([...disc, cityId]);
        ctx.setPlayerFlipped(prev => { const n = new Set(prev); n.delete(cityId); return n; });
        if (inDrawPhase && cityId === "epidemic") completeOneDraw(); // epidemic dragged to discard counts
      } else if (droppedHand) {
        // In deal phase: enforce deal order — cannot skip a player
        if (ctx.onChooseRoles) {
          const playerIdx = ['p1','p2','p3','p4'].indexOf(droppedHand);
          if (playerIdx > ctx.maxDealTargetIdx) return; // bounce — must deal to lower-numbered player first
        }
        const player = inDrawPhase ? ctx.currentPlayerKey : droppedHand;
        ctx.setPlayerDeck(deck.slice(0, -1));
        ctx.setPlayerFlipped(prev => { const n = new Set(prev); n.delete(cityId); return n; });
        const dest = (ctx.handCards as Record<string,string[]>)[player] ?? [];
        ctx.saveHandCards({ ...ctx.handCards, [player]: [...dest, cityId] });
        completeOneDraw();
      }
    };
    el.addEventListener("pointermove", onMove as EventListener);
    el.addEventListener("pointerup", onUp);
  };
}
