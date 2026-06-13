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
  playFundCard: (playerKey: string, cardIdx: number, cardId: string) => void;
  handStackOffset: (area: HandArea, count: number) => number;
  snapPawnToCity: (playerKey: string, cityId: string) => void;
  savePlayerCities: (next: string[]) => void;
  saveHandCards: (next: HandCards) => void;
  saveTurnState: (next: TurnStateData) => void;
  consumeAction: (ts: TurnStateData) => TurnStateData;
  setHandDrag: (d: { player: string; idx: number; x: number; y: number } | null) => void;
  setHandHover: (h: { player: string; idx: number; x: number; y: number } | null) => void;
  setFlexibleAidSelected: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedHandCards: React.Dispatch<React.SetStateAction<string[]>>;
  setPlayerDiscard: React.Dispatch<React.SetStateAction<string[]>>;
  setPendingDiscardMenu: (m: { cityId: string; player: string; idx: number; x: number; y: number } | null) => void;
}

/**
 * Hand-card pointer handler. Tap to play a fund card, toggle a Flexible-Aid
 * pick, or toggle a cure selection. Drag to discard (with game-phase
 * interception for Direct/Charter Flight & Build), to a teammate's hand
 * (Share Knowledge / Researcher take), to the active player's own hand (take),
 * or reorder within the same hand.
 */
export function makeHandCardPointerDown(
  ctx: HandCardCtx,
  args: { player: string; idx: number; cityId: string; isFundingHand: boolean },
) {
  const { player, idx: i, cityId, isFundingHand } = args;
  return (e: React.PointerEvent<HTMLDivElement>) => {
    if (ctx.calibrating) return;
    // In game phase: only current player can drag their own cards
    if (ctx.setup && player !== ctx.currentPlayerKey) {
      // Active player may take a card FROM a teammate's hand during their actions:
      //  • from a Researcher: any card (Researcher special)
      //  • from anyone else: only the card matching the active player's current city
      const teammateRole = ctx.setup.playerOrder[(['p1','p2','p3','p4'] as const).indexOf(player as 'p1'|'p2'|'p3'|'p4')]?.roleId;
      const isResearcher = teammateRole === 'researcher';
      const isMatchingTake = cityId === ctx.currentPlayerCityId;
      if (ctx.turnState.phase !== "actions" || (!isResearcher && !isMatchingTake)) return;
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
        // Tap: play fund event card (any phase, hand only)
        if (ctx.setup && isFundingHand) {
          ctx.playFundCard(player, i, cityId);
          return;
        }
        // Tap: select city cards for Flexible Aid
        if (ctx.setup && ctx.eventMode === 'flexible-aid' && player === ctx.pendingEventCard?.player && !isFundingHand && cityId !== 'epidemic') {
          const city = CITIES.find(c => c.id === cityId);
          if (city) {
            ctx.setFlexibleAidSelected(prev =>
              prev.includes(cityId) ? prev.filter(id => id !== cityId)
              : prev.length < 3 ? [...prev, cityId] : prev
            );
          }
          return;
        }
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

      if (nearDiscard && ctx.setup && ctx.turnState.phase === "actions") {
        // Game phase: intercept discard for flight/build actions
        const isFundCard = isFundingHand;
        const isEpidemicCard = cityId === "epidemic";
        if (!isFundCard && !isEpidemicCard) {
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
        // Fund/epidemic card: plain discard
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
          const giverCity = ctx.currentPlayerCityId;
          const receiverIdx = (['p1','p2','p3','p4'] as const).indexOf(otherPlayer as 'p1'|'p2'|'p3'|'p4');
          const receiverCity = ctx.playerCities[receiverIdx] ?? "atlanta";
          const valid = giverCity === receiverCity && cityId === giverCity;
          if (valid) {
            const receiverCards = (ctx.handCards as Record<string,string[]>)[otherPlayer] ?? [];
            ctx.saveHandCards({ ...ctx.handCards, [player]: current.filter((_, j) => j !== i), [otherPlayer]: [...receiverCards, cityId] });
            ctx.saveTurnState(ctx.consumeAction(ctx.turnState));
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
