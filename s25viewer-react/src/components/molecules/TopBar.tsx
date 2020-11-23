import * as React from 'react'

import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Tooltip,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import OpenIcon from '@material-ui/icons/FolderOpen'
import { useDispatch } from 'react-redux'
// eslint-disable-next-line import/no-unresolved
import { S25 } from 's25-wasm'
import { openImage } from '~/reducers'

const useStyles = makeStyles(theme => ({
    root: {
        flexGrow: 0,
        zIndex: 1,
    },
    menuButton: {
        marginRight: theme.spacing(2),
    },
    title: {
        flexGrow: 1,
    },
}))

export default function TopBar(_props: Record<string, unknown>): JSX.Element {
    const classes = useStyles()
    const filePicker = React.useRef(null as HTMLInputElement | null)
    const dispatch = useDispatch()

    React.useEffect(() => {
        if (filePicker.current === null) {
            return
        }

        filePicker.current.onchange = async event => {
            const { files } = event.target as HTMLInputElement
            if (files === null || files.length === 0) {
                return
            }

            const fileBuffer = await files[0].arrayBuffer()
            const newS25 = S25.open(new Uint8Array(fileBuffer)) ?? null
            dispatch(openImage(newS25))
        }
    }, [filePicker, dispatch])

    return (
        <div className={classes.root}>
            <input ref={filePicker} type="file" style={{ display: 'none' }} />
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" className={classes.title}>
                        S25Viewer
                    </Typography>
                    <Tooltip title="Opens an .S25 image from file.">
                        <IconButton
                            edge="end"
                            onClick={() => {
                                if (filePicker.current === null) {
                                    return
                                }

                                filePicker.current.click()
                            }}
                        >
                            <OpenIcon />
                        </IconButton>
                    </Tooltip>
                </Toolbar>
            </AppBar>
        </div>
    )
}
