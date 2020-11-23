import * as React from 'react'
import { Collapse, Drawer, List } from '@material-ui/core'
import { useDispatch } from 'react-redux'

import LayerItem from '~/components/molecules/LayerItem'
import EmptyLayerPlaceholder from './EmptyLayerPlaceholder'

import {
    useSelector,
    closeLayerList,
    setVisibility,
    setPictLayer,
} from '~/reducers'

export interface LayerListProps {
    drawer?: boolean
}

export default function LayerList({
    drawer = false,
}: LayerListProps): JSX.Element {
    const drawerOpen = useSelector(rootState => rootState.layerListVisible)
    const layers = useSelector(rootState => rootState.layers)
    const dispatch = useDispatch()

    const layerList = () =>
        layers.length === 0 ? (
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
        )

    return (
        <Drawer
            anchor={drawer ? 'bottom' : 'right'}
            open={drawerOpen}
            onClose={() => dispatch(closeLayerList())}
        >
            <div style={{ minWidth: '300px' }}>{layerList()}</div>
        </Drawer>
    )
}
