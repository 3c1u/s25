import * as React from 'react'

import { Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles(theme => ({
    root: {
        padding: theme.spacing(3),
        textAlign: 'center',
    },
}))

export default function NoImagePlaceholder(
    _props: Record<string, unknown>,
): JSX.Element {
    const classes = useStyles()

    return (
        <div className={classes.root}>
            <Typography variant="h6">No image loaded</Typography>
            <Typography variant="body1">
                You need to load an image first.
            </Typography>
        </div>
    )
}
