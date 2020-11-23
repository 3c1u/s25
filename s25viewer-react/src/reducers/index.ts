// ステートとかアクションとか．

// eslint-disable-next-line import/no-unresolved
import { S25 } from 's25-wasm'
import { createSelectorHook } from 'react-redux'

export interface Layer {
    name: string
    id: number
    activePictLayer: number
    visible: boolean
}

export interface RootState {
    image: S25 | null
    layers: Layer[]
    layerListVisible: boolean
}

const initialState: RootState = {
    image: null,
    layers: [],
    layerListVisible: false,
}

export const openImage = (image?: S25) =>
    ({
        type: 'OPEN_IMAGE',
        image,
    } as const)

export const openLayerList = () =>
    ({
        type: 'OPEN_LAYER_LIST',
    } as const)

export const closeLayerList = () =>
    ({
        type: 'CLOSE_LAYER_LIST',
    } as const)

export const setVisibility = (id: number, visible: boolean) =>
    ({
        type: 'SET_VISIBILITY',
        id,
        visible,
    } as const)

export const setPictLayer = (id: number, pictLayer: number) =>
    ({
        type: 'SET_PICT_LAYER',
        id,
        pictLayer,
    } as const)

type Actions = ReturnType<
    | typeof openImage
    | typeof openLayerList
    | typeof closeLayerList
    | typeof setVisibility
    | typeof setPictLayer
>

export default function reducer(
    currentState = initialState,
    action: Actions,
): RootState {
    switch (action.type) {
        case 'OPEN_IMAGE':
            // do nothing
            break
        case 'SET_VISIBILITY': {
            const { id, visible } = action
            return {
                ...currentState,
                layers: currentState.layers.map(l =>
                    l.id === id ? { ...l, visible } : { ...l },
                ),
            }
        }
        case 'SET_PICT_LAYER': {
            const { id, pictLayer } = action
            return {
                ...currentState,
                layers: currentState.layers.map(l =>
                    l.id === id
                        ? { ...l, activePictLayer: pictLayer }
                        : { ...l },
                ),
            }
        }
        case 'OPEN_LAYER_LIST':
            return { ...currentState, layerListVisible: true }
        case 'CLOSE_LAYER_LIST':
            return { ...currentState, layerListVisible: false }
        default:
            break
    }

    return currentState
}

export const useSelector = createSelectorHook<RootState, Actions>()
