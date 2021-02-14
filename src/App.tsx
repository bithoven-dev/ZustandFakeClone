import { useEffect, useState } from "react";

type State = Record<string, unknown>;

type PartialState<T> = ((state: T) => Partial<T>) | Partial<T>;

type SetState<T extends State> = (partialState: PartialState<T>) => void;

type GetState<T extends State> = () => T;

type CreateState<T extends State> = (set: SetState<T>, get: GetState<T>) => T;

interface UseStore<T extends State> {
  (): T;
  set: SetState<T>;
  get: GetState<T>;
}

type StateListener<T extends State> = (state: T) => void;

type Unsubscribe = () => void;

const create = <T extends State>(createState: CreateState<T>): UseStore<T> => {
  let globalState: T;

  const listeners: Set<StateListener<T>> = new Set();

  const set: SetState<T> = partialState => {
    const newPartialState =
      typeof partialState === "function"
        ? partialState(globalState)
        : partialState;
    globalState = {
      ...globalState,
      ...newPartialState
    };
    listeners.forEach(listener => listener(globalState));
  };

  const subscribe = (listener: StateListener<T>): Unsubscribe => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const get: GetState<T> = () => globalState;

  globalState = createState(set, get);

  const useStore = () => {
    const [state, setState] = useState<T>(globalState);

    useEffect(() => {
      const listener: StateListener<T> = state => {
        setState(state);
      };
      return subscribe(listener);
    }, []);

    return state;
  };

  return Object.assign(useStore, { set, get });
};

type UserState = {
  user?: string;
  login: () => void;
  logout: () => void;
};

const useUser = create<UserState>(set => ({
  login: () => set({ user: "n.elyousfi" }),
  logout: () => set({ user: undefined })
}));

type CarsState = {
  cars: number;
  increment: () => void;
  clear: () => void;
};

const useCars = create<CarsState>((set, get) => ({
  cars: 0,
  increment: () =>
    set(() => {
      const user = useUser.get().user;
      if (user) {
        const cars = get().cars + 1;
        return { cars };
      } else {
        return {};
      }
    }),
  clear: () => set({ cars: 0 })
}));

const App = () => {
  const { increment, clear } = useCars();

  const { cars } = useCars();

  const { user, login, logout } = useUser();

  return (
    <>
      {cars}
      <button onClick={increment}>INCREMENT</button>
      <button onClick={clear}>CLEAR</button>
      <br />
      {user ? (
        <>
          <p>{user}</p>
          <button onClick={logout}>LOGOUT</button>
        </>
      ) : (
        <button onClick={login}>LOGIN</button>
      )}
    </>
  );
};

export default App;
