import * as React from 'react'
import { Drawer, List } from '@material-ui/core'
import { useDispatch } from 'react-redux'

import LayerItem from '~/components/molecules/LayerItem'
import EmptyLayerPlaceholder from './EmptyLayerPlaceholder'

import {
    useSelector,
    closeLayerList,
    setVisibility,
    setPictLayer,
} from '~/reducers'

export default function LayerList(
    _props: Record<string, unknown>,
): JSX.Element {
    const drawerOpen = useSelector(rootState => rootState.layerListVisible)
    const layers = useSelector(rootState => rootState.layers)
    const dispatch = useDispatch()

    return (
        <Drawer
            anchor="bottom"
            open={drawerOpen}
            onClose={() => dispatch(closeLayerList())}
        >
            {layers.length === 0 ? (
                <EmptyLayerPlaceholder />
            ) : (
                <List>
                    {layers.map(layer => (
                        <LayerItem
                            key={layer.id}
                            name={layer.name}
                            visible={layer.visible}
                            value={layer.activePictLayer}
                            values={layer.pictLayers}
                            onVisiblilityChange={value => {
                                dispatch(setVisibility(layer.id, value))
                            }}
                            onChange={value => {
                                dispatch(setPictLayer(layer.id, value))
                            }}
                        />
                    ))}
                </List>
            )}
        </Drawer>
    )
}
