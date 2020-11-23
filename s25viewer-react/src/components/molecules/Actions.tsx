import * as React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Fab, Tooltip } from '@material-ui/core'
import LayersIcon from '@material-ui/icons/Layers'
import { useDispatch } from 'react-redux'
import { openLayerList } from '~/reducers'

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

    return (
        <div className={classes.root}>
            <Tooltip
                title="Manages the variation and visibility of layers"
                aria-label="open"
                onClick={() => {
                    dispatch(openLayerList())
                }}
            >
                <Fab color="secondary">
                    <LayersIcon />
                </Fab>
            </Tooltip>
        </div>
    )
}
