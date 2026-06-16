import type React from "react";
import type { CardState, HandCards, TurnPhase, TurnStateData } from "./boardStorage";
import type { PreGameSetup } from "./PreGamePhase";
import { CITIES } from "./cities";

type HandArea = { x: number; y: number; w: number; h: number };

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
  dealRequiredCards: number;
  dealCounts: number[];
  setPlayerDrag: (d: { cityId: string; x: number; y: number } | null) => void;
  setPlayerDeck: React.Dispatch<React.SetStateAction<string[]>>;
  setPlayerDiscard: React.Dispatch<React.SetStateAction<string[]>>;
  setPlayerFlipped: React.Dispatch<React.SetStateAction<Set<string>>>;
  saveTurnState: (next: TurnStateData) => void;
  saveHandCards: (next: HandCards) => void;
  /** Optional: called when a face-down card is tapped (flip to front) */
  onFlip?: (cityId: string) => void;
  /** Optional: called when a face-up card is tapped (flip back to back); responsible for delaying state removal */
  onUnflip?: (cityId: string) => void;
  /** Called when an epidemic card is drawn from the player deck */
  onEpidemic?: () => void;
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
      const inDrawPhase = !!ctx.setup && ctx.turnState.phase === "draw";
      const isEpidemic = cityId === "epidemic";

      if (!moved) {
        ctx.setPlayerDrag(null);
        // tap = flip; in draw phase block once both draws are committed
        if (inDrawPhase && ctx.turnState.drawCount >= 2) return;
        if (!faceUp) {
          ctx.onFlip?.(cityId);
          ctx.setPlayerFlipped(prev => { const n = new Set(prev); n.add(cityId); return n; });
        } else {
          // face-up → face-down: delegate timing to onUnflip (it removes from set after animation)
          if (ctx.onUnflip) {
            ctx.onUnflip(cityId);
          } else {
            ctx.setPlayerFlipped(prev => { const n = new Set(prev); n.delete(cityId); return n; });
          }
        }
        return;
      }

      // dragged
      const pos = toPct(ev);
      const nearDiscard = Math.abs(pos.x - ctx.cardPlayerDiscard.x) < 10 && Math.abs(pos.y - ctx.cardPlayerDiscard.y) < 10;
      const leftSide = pos.x < 5; const rightSide = pos.x > 95; const topHalf = pos.y < 51;
      const droppedHand: string | null = leftSide ? (topHalf ? 'p1' : 'p3') : rightSide ? (topHalf ? 'p2' : 'p4') : null;

      const completeOneDraw = () => {
        if (!inDrawPhase) return;
        const newCount = ctx.turnState.drawCount + 1;
        const hand = (ctx.handCards as Record<string,string[]>)[ctx.currentPlayerKey] ?? [];
        const handAfter = hand.length + (!isEpidemic ? 1 : 0);
        if (newCount >= 2) {
          // Both cards drawn — discard if over 7, else infect
          const phase: TurnPhase = handAfter > 7 ? "discard" : "infect";
          ctx.saveTurnState({ ...ctx.turnState, drawCount: newCount, phase, infectCount: 0 });
        } else {
          // First card drawn — must discard before drawing 2nd if already over 7
          const phase: TurnPhase = handAfter > 7 ? "discard" : "draw";
          ctx.saveTurnState({ ...ctx.turnState, drawCount: newCount, phase });
        }
      };

      if (faceUp && nearDiscard && !ctx.onChooseRoles) {
        // Draw phase: normal cards must go to hand — only epidemic allowed to discard
        if (inDrawPhase && !isEpidemic) { ctx.setPlayerDrag(null); return; }
        ctx.setPlayerDrag(null);
        ctx.setPlayerDeck(deck.slice(0, -1)); ctx.setPlayerDiscard([...disc, cityId]);
        ctx.setPlayerFlipped(prev => { const n = new Set(prev); n.delete(cityId); return n; });
        if (inDrawPhase && isEpidemic) { ctx.onEpidemic?.(); completeOneDraw(); }
      } else if (droppedHand && faceUp) {
        // Draw phase: epidemic must go to discard — only normal cards allowed to hand
        if (inDrawPhase && isEpidemic) { ctx.setPlayerDrag(null); return; }
        ctx.setPlayerDrag(null);
        if (ctx.onChooseRoles) {
          const playerIdx = ['p1','p2','p3','p4'].indexOf(droppedHand);
          if (playerIdx > ctx.maxDealTargetIdx) return;
          if ((ctx.dealCounts[playerIdx] ?? 0) >= ctx.dealRequiredCards) return;
        }
        const player = inDrawPhase ? ctx.currentPlayerKey : droppedHand;
        ctx.setPlayerDeck(deck.slice(0, -1));
        ctx.setPlayerFlipped(prev => { const n = new Set(prev); n.delete(cityId); return n; });
        const dest = (ctx.handCards as Record<string,string[]>)[player] ?? [];
        ctx.saveHandCards({ ...ctx.handCards, [player]: [...dest, cityId] });
        completeOneDraw();
      } else if (droppedHand && !faceUp && !inDrawPhase) {
        // Deal phase only: face-down drag straight to hand
        ctx.setPlayerDrag(null);
        if (ctx.onChooseRoles) {
          const playerIdx = ['p1','p2','p3','p4'].indexOf(droppedHand);
          if (playerIdx > ctx.maxDealTargetIdx) return;
          if ((ctx.dealCounts[playerIdx] ?? 0) >= ctx.dealRequiredCards) return;
        }
        ctx.setPlayerDeck(deck.slice(0, -1));
        ctx.setPlayerFlipped(prev => { const n = new Set(prev); n.delete(cityId); return n; });
        const dest = (ctx.handCards as Record<string,string[]>)[droppedHand] ?? [];
        ctx.saveHandCards({ ...ctx.handCards, [droppedHand]: [...dest, cityId] });
      } else {
        ctx.setPlayerDrag(null);
      }
    };
    el.addEventListener("pointermove", onMove as EventListener);
    el.addEventListener("pointerup", onUp);
  };
}

/** Context for a draggable card sitting in a player's hand. */
export interface HandCardCtx {
  calibrating: boolean;
  setup: PreGameSetup | undefined;          // truthy ⇒ game phase (vs. deal/calibrate)
  currentPlayerKey: string;
  currentPlayerCityId: string;
  turnState: TurnStateData;
  boardRef: BoardRef;
  handCards: HandCards;
  cardPlayerDiscard: CardState;
  handAreas: Record<string, HandArea>;      // p1..p4 hand-area rects
  activePlayers: readonly string[];
  cureSelecting: boolean;
  eventMode: string | null;
  pendingEventCard: { player: string; idx: number; cardId: string } | null;
  playerCities: string[];
  onFundCardDiscard?: (cardId: string, player: string, idx: number) => void;
  handStackOffset: (area: HandArea, count: number) => number;
  snapPawnToCity: (playerKey: string, cityId: string) => void;
  savePlayerCities: (next: string[]) => void;
  saveHandCards: (next: HandCards) => void;
  saveTurnState: (next: TurnStateData) => void;
  consumeAction: (ts: TurnStateData) => TurnStateData;
  setHandDrag: (d: { player: string; idx: number; x: number; y: number } | null) => void;
  setHandHover: (h: { player: string; idx: number; x: number; y: number } | null) => void;
  flexibleAidSelected: string[];
  setFlexibleAidSelected: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedHandCards: React.Dispatch<React.SetStateAction<string[]>>;
  setPlayerDiscard: React.Dispatch<React.SetStateAction<string[]>>;
  setPendingDiscardMenu: (m: { cityId: string; player: string; idx: number; x: number; y: number } | null) => void;
  canPlayFund?: (cardId: string) => boolean;
  onFlexibleAidComplete?: () => void;
}

/**
 * Hand-card pointer handler. Tap to toggle a cure selection. Drag fund cards
 * to the discard pile to activate them (actions phase or draw phase before any
 * cards drawn). Drag city cards to discard (with game-phase interception for
 * Direct/Charter Flight & Build), to a teammate's hand (Share Knowledge /
 * Researcher take), to the active player's own hand (take), or reorder within
 * the same hand.
 */
export function makeHandCardPointerDown(
  ctx: HandCardCtx,
  args: { player: string; idx: number; cityId: string; isFundingHand: boolean },
) {
  const { player, idx: i, cityId, isFundingHand } = args;
  return (e: React.PointerEvent<HTMLDivElement>) => {
    if (ctx.calibrating) return;
    // Fund event cards are playable from any player's hand at any time — skip turn/phase checks
    if (!isFundingHand) {
      // In game phase: only current player can drag their own city/epidemic cards
      if (ctx.setup && player !== ctx.currentPlayerKey) {
        // Exception: designated player must discard after receiving a card over limit
        if (ctx.turnState.phase === "discard-action" && ctx.turnState.discardPlayer === player) {
          // allow fall-through so they can drag to discard
        } else {
          // Active player may take a card FROM a teammate's hand during their actions:
          //  • from a Researcher: any card (Researcher special)
          //  • from anyone else: only the card matching the active player's current city
          const teammateRole = ctx.setup.playerOrder[(['p1','p2','p3','p4'] as const).indexOf(player as 'p1'|'p2'|'p3'|'p4')]?.roleId;
          const isResearcher = teammateRole === 'researcher';
          const isMatchingTake = cityId === ctx.currentPlayerCityId;
          // Allow dragging any city card to the discard during flexible-aid mode (any phase)
          const isFlexibleAidDrag = ctx.eventMode === 'flexible-aid';
          if (!isFlexibleAidDrag && (ctx.turnState.phase !== "actions" || (!isResearcher && !isMatchingTake))) return;
        }
      }
    }
    e.stopPropagation(); e.preventDefault();
    const el = e.currentTarget; el.setPointerCapture(e.pointerId);
    const r = ctx.boardRef.current!.getBoundingClientRect();
    const toPct = (ev: PointerEvent) => ({ x: ((ev.clientX - r.left) / r.width) * 100, y: ((ev.clientY - r.top) / r.height) * 100 });
    let moved = false;
    const sx = e.clientX; const sy = e.clientY;
    const onMove = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) moved = true;
      if (moved) { ctx.setHandDrag({ player, idx: i, ...toPct(ev) }); ctx.setHandHover(null); }
    };
    const onUp = (ev: PointerEvent) => {
      el.removeEventListener("pointermove", onMove as EventListener);
      el.removeEventListener("pointerup", onUp);
      ctx.setHandDrag(null);
      if (!moved) {
        // Tap: toggle card selection for cure (game phase only)
        if (ctx.setup && ctx.cureSelecting) {
          ctx.setSelectedHandCards(prev =>
            prev.includes(cityId) ? prev.filter(id => id !== cityId) : [...prev, cityId]
          );
        }
        return;
      }
      const pos = toPct(ev);
      const current = (ctx.handCards as Record<string,string[]>)[player] ?? [];
      const nearDiscard = Math.abs(pos.x - ctx.cardPlayerDiscard.x) < 10 && Math.abs(pos.y - ctx.cardPlayerDiscard.y) < 10;
      // Determine all player hand areas for target detection (check both x and y proximity)
      const HAND_AREAS = ctx.handAreas;
      const otherPlayer = (ctx.activePlayers as readonly string[]).find(pk =>
        pk !== player &&
        Math.abs(pos.x - HAND_AREAS[pk].x) < 8 &&
        Math.abs(pos.y - HAND_AREAS[pk].y) < 30
      );

      const isDiscardPhase = ctx.turnState.phase === 'discard' || ctx.turnState.phase === 'discard-action';

      // Flexible Aid selection: city cards only (not fund/epidemic) — go to graveyard immediately; auto-exits at 3.
      if (nearDiscard && ctx.setup && ctx.eventMode === 'flexible-aid' && !isFundingHand && cityId !== 'epidemic') {
        if (ctx.flexibleAidSelected.length < 3) {
          ctx.saveHandCards({ ...ctx.handCards, [player]: current.filter((_, j) => j !== i) });
          ctx.setPlayerDiscard(prev => [...prev, cityId]);
          const next = [...ctx.flexibleAidSelected, cityId];
          ctx.setFlexibleAidSelected(() => next);
          if (next.length >= 3) ctx.onFlexibleAidComplete?.();
        }
        return;
      }

      // Per-card phase gates:
      // fund7 (Borrowed Time): blocked during draw(1+) and infect — only actions, draw(0), discard phases
      // fund8 (Flexible Aid): only current player can activate; phase check in canPlayFund
      // all others: playable at any phase by any player
      const fundPhaseOk = cityId === 'fund7'
        ? (ctx.turnState.phase === 'actions' || (ctx.turnState.phase === 'draw' && ctx.turnState.drawCount === 0) || isDiscardPhase)
        : true;

      // Fund event cards: drag to discard to activate — fund8 now goes to graveyard immediately like others
      if (nearDiscard && ctx.setup && isFundingHand && cityId !== 'epidemic' && fundPhaseOk) {
        if (ctx.canPlayFund && !ctx.canPlayFund(cityId)) return;
        ctx.saveHandCards({ ...ctx.handCards, [player]: current.filter((_, j) => j !== i) });
        ctx.setPlayerDiscard(prev => [...prev, cityId]);
        ctx.onFundCardDiscard?.(cityId, player, i);
        return;
      }

      if (nearDiscard && ctx.setup && ctx.turnState.phase === "actions") {
        // Game phase: intercept discard for flight/build/direct-flight actions
        const isEpidemicCard = cityId === "epidemic";
        if (!isEpidemicCard) {
          if (cityId === ctx.currentPlayerCityId) {
            // Charter Flight or Build Research Station — show popup
            ctx.setPendingDiscardMenu({ cityId, player, idx: i, x: ev.clientX, y: ev.clientY });
            return;
          } else {
            // Direct Flight — fly to card's city
            const destCity = CITIES.find(c => c.id === cityId);
            if (destCity) {
              const nextCities = [...ctx.playerCities]; nextCities[ctx.turnState.currentPlayerIndex] = cityId;
              ctx.savePlayerCities(nextCities); ctx.snapPawnToCity(player, cityId);
              ctx.saveHandCards({ ...ctx.handCards, [player]: current.filter((_, j) => j !== i) });
              ctx.setPlayerDiscard(prev => [...prev, cityId]);
              ctx.saveTurnState(ctx.consumeAction(ctx.turnState));
              return;
            }
          }
        }
        // Epidemic card: plain discard
        ctx.saveHandCards({ ...ctx.handCards, [player]: current.filter((_, j) => j !== i) });
        ctx.setPlayerDiscard(prev => [...prev, cityId]);
        return;
      }

      if (nearDiscard && ctx.setup && isDiscardPhase) {
        // Hand-limit phase: plain discard for city/epidemic cards (fund cards handled above)
        ctx.saveHandCards({ ...ctx.handCards, [player]: current.filter((_, j) => j !== i) });
        ctx.setPlayerDiscard(prev => [...prev, cityId]);
        return;
      }

      if (nearDiscard && !ctx.setup) {
        // Pre-game: free discard
        ctx.saveHandCards({ ...ctx.handCards, [player]: current.filter((_, j) => j !== i) });
        ctx.setPlayerDiscard(prev => [...prev, cityId]);
        return;
      }

      if (ctx.setup && ctx.turnState.phase === "actions") {
        // Take: active player dragging a teammate's card TO their own hand.
        // Researcher → any card; anyone else → only the card matching the active player's city.
        if (player !== ctx.currentPlayerKey && otherPlayer === ctx.currentPlayerKey) {
          const teammateIdx = (['p1','p2','p3','p4'] as const).indexOf(player as 'p1'|'p2'|'p3'|'p4');
          const teammateCity = ctx.playerCities[teammateIdx] ?? "atlanta";
          const teammateRole = ctx.setup.playerOrder[teammateIdx]?.roleId;
          const legal = teammateCity === ctx.currentPlayerCityId &&
            (teammateRole === 'researcher' || cityId === ctx.currentPlayerCityId);
          if (legal) {
            const myCards = (ctx.handCards as Record<string,string[]>)[ctx.currentPlayerKey] ?? [];
            ctx.saveHandCards({ ...ctx.handCards, [player]: current.filter((_, j) => j !== i), [ctx.currentPlayerKey]: [...myCards, cityId] });
            ctx.saveTurnState(ctx.consumeAction(ctx.turnState));
          }
          return;
        }
        if (otherPlayer) {
          // Share Knowledge: valid if both players in same city and card matches giver's city
          // Researcher exception: can give any card (not just the matching city card)
          const giverCity = ctx.currentPlayerCityId;
          const giverIdx = (['p1','p2','p3','p4'] as const).indexOf(player as 'p1'|'p2'|'p3'|'p4');
          const giverRole = ctx.setup.playerOrder[giverIdx]?.roleId;
          const receiverIdx = (['p1','p2','p3','p4'] as const).indexOf(otherPlayer as 'p1'|'p2'|'p3'|'p4');
          const receiverCity = ctx.playerCities[receiverIdx] ?? "atlanta";
          const valid = giverCity === receiverCity && (cityId === giverCity || giverRole === 'researcher');
          if (valid) {
            const receiverCards = (ctx.handCards as Record<string,string[]>)[otherPlayer] ?? [];
            const newReceiverCards = [...receiverCards, cityId];
            ctx.saveHandCards({ ...ctx.handCards, [player]: current.filter((_, j) => j !== i), [otherPlayer]: newReceiverCards });
            const afterAction = ctx.consumeAction(ctx.turnState);
            if (newReceiverCards.length > 7) {
              ctx.saveTurnState({ ...afterAction, phase: "discard-action", discardPlayer: otherPlayer });
            } else {
              ctx.saveTurnState(afterAction);
            }
            return;
          }
          return;
        }
      }

      if (otherPlayer && !ctx.setup) {
        // Pre-game free transfer between hands
        const destCards = (ctx.handCards as Record<string,string[]>)[otherPlayer] ?? [];
        ctx.saveHandCards({ ...ctx.handCards, [player]: current.filter((_, j) => j !== i), [otherPlayer]: [...destCards, cityId] });
        return;
      }

      // Reorder within same hand
      const area = HAND_AREAS[player] ?? HAND_AREAS.p1;
      const areaT = area.y - area.h / 2;
      const so = ctx.handStackOffset(area, current.length);
      const targetIdx = Math.max(0, Math.min(current.length - 1, Math.round((pos.y - areaT) / (so || 1))));
      if (targetIdx !== i) {
        const next = [...current]; next.splice(i, 1); next.splice(targetIdx, 0, cityId);
        ctx.saveHandCards({ ...ctx.handCards, [player]: next });
      }
    };
    el.addEventListener("pointermove", onMove as EventListener);
    el.addEventListener("pointerup", onUp);
  };
}
