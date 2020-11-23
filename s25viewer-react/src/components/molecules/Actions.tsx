import * as React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Fab, Tooltip } from '@material-ui/core'
import ColorsIcon from '@material-ui/icons/Palette'
import LayersIcon from '@material-ui/icons/Layers'
import { useDispatch } from 'react-redux'

import { useSelector, toggleLayerList, setColorPickerVisible } from '~/reducers'

const useStyles = makeStyles(theme => ({
    root: {
        '& > *': {
            margin: theme.spacing(1),
        },
        position: 'absolute',
        bottom: theme.spacing(2),
        right: theme.spacing(2),
    },
}))

export default function Actions(_props: Record<string, unknown>): JSX.Element {
    const classes = useStyles()
    const dispatch = useDispatch()
    const colorPickerVisible = useSelector(s => s.colorPickerVisible)

    return (
        <div className={classes.root}>
            <Tooltip
                title="Picks a background color."
                aria-label="color"
                onClick={() => {
                    dispatch(setColorPickerVisible(!colorPickerVisible))
                }}
            >
                <Fab color="primary">
                    <ColorsIcon />
                </Fab>
            </Tooltip>
            <Tooltip
                title="Manages the variation and visibility of layers"
                aria-label="layer"
                onClick={() => {
                    dispatch(toggleLayerList())
                }}
            >
                <Fab color="secondary">
                    <LayersIcon />
                </Fab>
            </Tooltip>
        </div>
    )
}
