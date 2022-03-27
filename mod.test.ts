import { assertEquals } from "https://deno.land/std@0.132.0/testing/asserts.ts";
import { configureStore } from "https://esm.sh/@reduxjs/toolkit?target=deno";
import { StateIterable } from "./mod.ts";

type State = number;

type Action =
  // Expected actions
  | { type: "Increment" }
  | { type: "Decrement" }
  // Redux uses some private event for initialization
  | { type: string };

Deno.test("StateIterable", async (t) => {
  const store = configureStore<State, Action>({
    reducer: (state = 0, action) => {
      switch (action.type) {
        case "Increment":
          return state + 1;
        case "Decrement":
          return state - 1;
        default:
          return state;
      }
    },
  });

  const stateIterable = new StateIterable(store);
  const iter = stateIterable[Symbol.asyncIterator]();

  await t.step("producing the inital state", async () => {
    assertEquals(await iter.next(), {
      done: false,
      value: 0,
    });
  });

  await t.step("waiting for the next state", async () => {
    const nextState = iter.next();

    store.dispatch({ type: "Increment" });

    assertEquals(await nextState, {
      done: false,
      value: 1,
    });
  });

  await t.step({
    name: "when multiple actions happen before we take the next state",
    async fn() {
      store.dispatch({ type: "Increment" });
      store.dispatch({ type: "Increment" });

      assertEquals(await iter.next(), {
        done: false,
        value: 2,
      });

      assertEquals(await iter.next(), {
        done: false,
        value: 3,
      });
    },
  });

  await t.step({
    name: "unsubscribe",
    async fn() {
      stateIterable.unsubscribe();

      store.dispatch({ type: "Increment" });

      assertEquals(await iter.next(), {
        done: true,
        value: undefined,
      });
    },
  });
});
