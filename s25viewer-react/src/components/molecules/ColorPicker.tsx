import * as React from 'react'

import { Backdrop, Zoom, makeStyles } from '@material-ui/core'
import { SketchPicker } from 'react-color'
import { useDispatch } from 'react-redux'
import {
    useSelector,
    setBackgroundColor,
    setColorPickerVisible,
} from '~/reducers'

const useStyles = makeStyles(theme => ({
    backdrop: {
        zIndex: theme.zIndex.drawer + 1,
        color: '#fff',
    },
}))

export default function ColorPicker(
    _props: Record<string, unknown>,
): JSX.Element {
    const colorPickerVisible = useSelector(s => s.colorPickerVisible)
    const classes = useStyles()
    const color = useSelector(s => s.backgroundColor)
    const dispatch = useDispatch()

    return (
        <Backdrop
            open={colorPickerVisible}
            onClick={() => {
                dispatch(setColorPickerVisible(false))
            }}
            className={classes.backdrop}
        >
            <Zoom in={colorPickerVisible}>
                <SketchPicker
                    onChange={c =>
                        dispatch(
                            setBackgroundColor(
                                `rgba(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b}, ${
                                    c.rgb.a ?? 100
                                })`,
                            ),
                        )
                    }
                    color={color}
                />
            </Zoom>
        </Backdrop>
    )
}
