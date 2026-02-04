import { useState } from "react";
import { SerializedStateString, State } from "./state";

export interface QueryState {
  s: SerializedStateString;
  v: string;
}

const VERSION = "1";

export const useQueryState = (initialState: () => State) => {
  const [prevState, setPrevState] = useState<State | null>(null);
  const [currentState, setCurrentState] = useState<State>(initialState);

  if (prevState === null) {
    // prevQuery is null on first render so we need to initialize it and set the query from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const queryFromUrl = Object.fromEntries(
      urlParams.entries(),
    ) as Partial<QueryState>;

    const deserializedState = queryFromUrl.s
      ? State.deserialize(queryFromUrl.s)
      : currentState;

    setCurrentState(deserializedState);
    setPrevState(deserializedState);
  }

  if (currentState !== prevState) {
    // when setCurrentState is called, we need to update the URL
    const newUrl = new URL(window.location.href);
    const serializedState = currentState.serialize();
    const queryState: QueryState | undefined = serializedState
      ? {
          s: serializedState,
          v: VERSION,
        }
      : undefined;

    newUrl.search = new URLSearchParams(
      (queryState ?? {}) as Record<string, string>,
    ).toString();
    window.history.replaceState({}, "", newUrl.toString());
    setPrevState(currentState);
  }

  return { currentState, setCurrentState };
};
