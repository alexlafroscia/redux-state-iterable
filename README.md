# Redux State Iterable

> Create an `AsyncIterable` from a Redux store

## Usage

```typescript
import { StateIterable } from "./mod.ts";
import { configureStore } from "https://esm.sh/@reduxjs/toolkit?target=deno";

type State = number;

type Action =
  // Expected actions
  | { type: "Increment" }
  | { type: "Decrement" }
  // Redux uses some private event for initialization
  | { type: string };

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

const states = new StateIterable(store);

for await (const state of states) {
  // Do something with each state
}

// Clean up the subscription when you're done!
states.unsubscribe();
```
