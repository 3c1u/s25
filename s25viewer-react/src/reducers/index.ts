// ステートとかアクションとか．

interface State {
    filename: string | null
}

const initialState: State = {
    filename: null,
}

type Actions = { type: string }

export default function reducer(
    currentState = initialState,
    _action: Actions,
): State {
    return currentState
}
