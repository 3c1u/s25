import * as React from 'react'
import { useDispatch } from 'react-redux'
import { makeStyles } from '@material-ui/core/styles'

// eslint-disable-next-line import/no-unresolved
import { S25 } from 's25-wasm'

import { useSelector, openImage } from '~/reducers'
import NoImagePlaceholder from '~/components/molecules/NoImagePlaceholder'
import ImageRenderer from '~/components/atoms/ImageRenderer'

const useStyles = makeStyles(_ => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        flex: '1',
    },
    dragged: {
        opacity: 0.5,
    },
}))

export default function ImageView(
    _props: Record<string, unknown>,
): JSX.Element {
    const classes = useStyles()
    const [dragEntered, setDragEntered] = React.useState(false)
    const image = useSelector(rootState => rootState.image)
    const dispatch = useDispatch()

    return (
        <div
            className={[classes.root, dragEntered && classes.dragged]
                .filter(Boolean)
                .join(' ')}
            onDragOver={event => {
                event.preventDefault()
                setDragEntered(true)
            }}
            onDragLeave={event => {
                event.preventDefault()
                setDragEntered(false)
            }}
            onDrop={async event => {
                event.preventDefault()
                event.stopPropagation()
                setDragEntered(false)

                if (image !== null) {
                    dispatch(openImage(null))
                }

                if (event.dataTransfer.files.length !== 1) {
                    return
                }

                const file = event.dataTransfer.files[0]

                const fileBuffer = await file.arrayBuffer()
                const newS25 = S25.open(new Uint8Array(fileBuffer)) ?? null
                dispatch(openImage(newS25))
            }}
        >
            {image !== null ? (
                <ImageRenderer image={image} />
            ) : (
                <NoImagePlaceholder />
            )}
        </div>
    )
}
