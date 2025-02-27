import { createMachine, Interpreter, assign, TransitionsConfig } from "xstate";
import { fromWei } from "web3-utils";
import { Decimal } from "decimal.js-light";
import { EVENTS, GameEvent } from "../events";
import { processEvent } from "./processEvent";

import { Context as AuthContext } from "features/auth/lib/authMachine";
import { metamask } from "../../../lib/blockchain/metamask";

import { GameState, InventoryItemName } from "../types/game";
import { loadSession } from "../actions/loadSession";
import { INITIAL_FARM } from "./constants";
import { autosave } from "../actions/autosave";
import { mint } from "../actions/mint";
import { LimitedItem } from "../types/craftables";
import { sync } from "../actions/sync";
import { withdraw } from "../actions/withdraw";

export type PastAction = GameEvent & {
  createdAt: Date;
};

export interface Context {
  state: GameState;
  actions: PastAction[];
}

type MintEvent = {
  type: "MINT";
  item: LimitedItem;
};

type WithdrawEvent = {
  type: "WITHDRAW";
  sfl: number;
  ids: number[];
  amounts: string[];
};

export type BlockchainEvent =
  | {
      type: "SAVE";
    }
  | {
      type: "SYNC";
    }
  | WithdrawEvent
  | GameEvent
  | MintEvent;

// For each game event, convert it to an XState event + handler
const GAME_EVENT_HANDLERS: TransitionsConfig<Context, BlockchainEvent> =
  Object.keys(EVENTS).reduce(
    (events, eventName) => ({
      ...events,
      [eventName]: {
        actions: assign((context: Context, event: GameEvent) => ({
          state: processEvent(context.state as GameState, event) as GameState,
          actions: [
            ...context.actions,
            {
              ...event,
              createdAt: new Date(),
            },
          ],
        })),
      },
    }),
    {}
  );

export type BlockchainState = {
  value:
    | "loading"
    | "playing"
    | "readonly"
    | "autosaving"
    | "minting"
    | "success"
    | "syncing"
    | "withdrawing"
    | "error";
  context: Context;
};

export type MachineInterpreter = Interpreter<
  Context,
  any,
  BlockchainEvent,
  BlockchainState
>;

export function startGame(authContext: AuthContext) {
  return createMachine<Context, BlockchainEvent, BlockchainState>({
    id: "gameMachine",
    initial: "loading",
    context: {
      actions: [],
      state: INITIAL_FARM,
    },
    states: {
      loading: {
        invoke: {
          src: async () => {
            // Load the farm session
            if (authContext.sessionId) {
              const game = await loadSession({
                farmId: Number(authContext.farmId),
                sessionId: authContext.sessionId as string,
                signature: authContext.signature as string,
                sender: metamask.myAccount as string,
              });

              if (!game) {
                throw new Error("NO_FARM");
              }

              return {
                state: game,
              };
            }

            // They are an anonymous user
            // TODO: Load from Web3

            return { state: INITIAL_FARM };
          },
          onDone: {
            //target: authContext.sessionId ? "playing" : "readonly",
            target: authContext.sessionId ? "playing" : "playing",
            actions: assign({
              state: (context, event) => event.data.state,
            }),
          },
          onError: {
            target: "error",
          },
        },
      },
      playing: {
        on: {
          ...GAME_EVENT_HANDLERS,
          SAVE: {
            target: "autosaving",
          },
          MINT: {
            target: "minting",
          },
          SYNC: {
            target: "syncing",
          },
          WITHDRAW: {
            target: "withdrawing",
          },
        },
      },
      autosaving: {
        on: {
          ...GAME_EVENT_HANDLERS,
        },
        invoke: {
          src: async (context) => {
            const saveAt = new Date();

            if (context.actions.length > 0) {
              await autosave({
                farmId: Number(authContext.farmId),
                sessionId: authContext.sessionId as string,
                sender: metamask.myAccount as string,
                actions: context.actions,
                signature: authContext.signature as string,
              });
            }
            // This gives the UI time to indicate that a save is taking place both when clicking save
            // and when autosaving
            await new Promise((res) => setTimeout(res, 1000));

            return {
              saveAt,
            };
          },
          onDone: {
            target: "playing",
            // Remove the events that were submitted
            actions: assign((context: Context, event) => ({
              actions: context.actions.filter(
                (action) =>
                  action.createdAt.getTime() > event.data.saveAt.getTime()
              ),
            })),
          },
          onError: {
            target: "error",
          },
        },
      },
      minting: {
        invoke: {
          src: async (context, event) => {
            // Autosave just in case
            if (context.actions.length > 0) {
              await autosave({
                farmId: Number(authContext.farmId),
                sessionId: authContext.sessionId as string,
                sender: metamask.myAccount as string,
                actions: context.actions,
                signature: authContext.signature as string,
              });
            }

            await mint({
              farmId: Number(authContext.farmId),
              sessionId: authContext.sessionId as string,
              sender: metamask.myAccount as string,
              signature: authContext.signature as string,
              item: (event as MintEvent).item,
            });
          },
          onDone: {
            target: "success",
          },
          onError: {
            target: "error",
          },
        },
      },
      syncing: {
        invoke: {
          src: async (context) => {
            // Autosave just in case
            if (context.actions.length > 0) {
              await autosave({
                farmId: Number(authContext.farmId),
                sessionId: authContext.sessionId as string,
                sender: metamask.myAccount as string,
                actions: context.actions,
                signature: authContext.signature as string,
              });
            }

            await sync({
              farmId: Number(authContext.farmId),
              sessionId: authContext.sessionId as string,
              signature: authContext.signature as string,
            });
          },
          onDone: {
            target: "success",
          },
          onError: {
            target: "error",
          },
        },
      },
      withdrawing: {
        invoke: {
          src: async (_, event) => {
            const { amounts, ids, sfl } = event as WithdrawEvent;
            await withdraw({
              farmId: Number(authContext.farmId),
              sessionId: authContext.sessionId as string,
              signature: authContext.signature as string,
              amounts,
              ids,
              sfl,
            });
          },
          onDone: {
            target: "success",
          },
          onError: {
            target: "error",
          },
        },
      },
      readonly: {},
      error: {},
      success: {},
    },
  });
}
