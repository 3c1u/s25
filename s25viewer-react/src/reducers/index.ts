// ステートとかアクションとか．

// eslint-disable-next-line import/no-unresolved
import { S25 } from 's25-wasm'
import { createSelectorHook } from 'react-redux'

export interface Layer {
    name: string
    id: number
    activePictLayer: number
    pictLayers: number[]
    visible: boolean
}

export interface RootState {
    image: S25 | null
    layers: Layer[]
    backgroundColor: string
    layerListVisible: boolean
    colorPickerVisible: boolean
}

export const initialState: RootState = {
    image: null,
    layers: [],
    backgroundColor: 'rgba(255, 255, 255, 100)',
    layerListVisible: false,
    colorPickerVisible: false,
}

export const openImage = (image?: S25 | null) =>
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

export const toggleLayerList = () =>
    ({
        type: 'TOGGLE_LAYER_LIST',
    } as const)

export const setColorPickerVisible = (flag: boolean) =>
    ({
        type: 'SET_COLOR_PICKER_VISIBLE',
        flag,
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

export const setBackgroundColor = (color: string) =>
    ({
        type: 'SET_BACKGROUND_COLOR',
        color,
    } as const)

type Actions = ReturnType<
    | typeof openImage
    | typeof openLayerList
    | typeof closeLayerList
    | typeof toggleLayerList
    | typeof setColorPickerVisible
    | typeof setVisibility
    | typeof setPictLayer
    | typeof setBackgroundColor
>

export default function reducer(
    currentState = initialState,
    action: Actions,
): RootState {
    switch (action.type) {
        case 'OPEN_IMAGE': {
            const oldImage = currentState.image
            if (oldImage !== null) {
                oldImage.free()
            }

            const image = action.image ?? null
            if (image === null) {
                return {
                    ...currentState,
                    image: null,
                    layers: [],
                }
            }

            const layers: Layer[] = Array.from(
                Array(Math.ceil(image.total_entries() / 100)),
                (_, k) => ({
                    name: `Layer ${k + 1}`,
                    id: k * 100,
                    activePictLayer: -1,
                    pictLayers: Array.from(
                        Array(101),
                        (_, k_) => k_,
                    ).filter(p => image.exists(k * 100 + p)),
                    visible: false,
                }),
            )

            return {
                ...currentState,
                image,
                layers,
            }
        }
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
        case 'TOGGLE_LAYER_LIST':
            return {
                ...currentState,
                layerListVisible: !currentState.layerListVisible,
            }
        case 'OPEN_LAYER_LIST':
            return { ...currentState, layerListVisible: true }
        case 'CLOSE_LAYER_LIST':
            return { ...currentState, layerListVisible: false }
        case 'SET_BACKGROUND_COLOR':
            return { ...currentState, backgroundColor: action.color }
        case 'SET_COLOR_PICKER_VISIBLE':
            return { ...currentState, colorPickerVisible: action.flag }
        default:
            break
    }

    return currentState
}

export const useSelector = createSelectorHook<RootState, Actions>()
