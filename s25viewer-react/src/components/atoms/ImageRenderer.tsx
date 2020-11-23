import { ImageRounded } from '@material-ui/icons'
import * as React from 'react'
// eslint-disable-next-line import/no-unresolved
import { S25 } from 's25-wasm'
import { cache } from 'webpack'
import { Layer, useSelector } from '~/reducers'

interface ImageRendererProps {
    image: S25
}

interface LayerCache {
    bitmap: ImageBitmap
    offsetX: number
    offsetY: number
}

export default function ImageRenderer(_props: ImageRendererProps): JSX.Element {
    const [width, setWidth] = React.useState(0)
    const [height, setHeight] = React.useState(0)
    const [needsRedraw, setNeedsRedraw] = React.useState(true)
    const [layerCache, setLayerCache] = React.useState([] as LayerCache[])

    const canvas = React.useRef(null as HTMLCanvasElement | null)

    const [image, layers] = useSelector(s => [s.image, s.layers])

    const redraw = (theCanvas: HTMLCanvasElement, theLayers: LayerCache[]) => {
        const ctx = theCanvas.getContext('2d')
        if (ctx === null) {
            return
        }

        ctx.clearRect(0, 0, theCanvas.width, theCanvas.height)

        Promise.all(
            theLayers.map(async l => {
                const { bitmap, offsetX, offsetY } = l
                ctx.drawImage(bitmap, offsetX, offsetY)
            }),
        )
    }

    const loadImages = async (s25: S25, theLayers: Layer[]) => {
        const cachedLayers = await Promise.all(
            theLayers.map(
                async (l: Layer): Promise<LayerCache | null> => {
                    if (!l.visible) {
                        return null
                    }

                    const entry = l.id + l.activePictLayer
                    const metadata = s25.get_metadata(entry)
                    if (metadata === undefined) {
                        return null
                    }

                    const offsetX = metadata.offset_x
                    const offsetY = metadata.offset_y
                    const imgWidth = metadata.width
                    const imgHeight = metadata.height

                    metadata.free()

                    const theImage = s25.decode_rgba(entry)
                    if (theImage === undefined) {
                        return null
                    }

                    const imageData = new ImageData(
                        new Uint8ClampedArray(theImage),
                        imgWidth,
                        imgHeight,
                    )

                    const bitmap = await createImageBitmap(imageData)

                    return { bitmap, offsetX, offsetY }
                },
            ),
        )

        setLayerCache(cachedLayers.filter(v => v !== null) as LayerCache[])
        setNeedsRedraw(true)
    }

    React.useEffect(() => {
        const theCanvas = canvas.current
        if (theCanvas === null) {
            return
        }

        if (needsRedraw) {
            setNeedsRedraw(false)
            redraw(theCanvas, layerCache)
        }
    }, [needsRedraw, canvas, layerCache])

    React.useEffect(() => {
        const theCanvas = canvas.current
        if (theCanvas === null) {
            return () => {
                // do nothing
            }
        }

        const updateSize = () => {
            setWidth(0)
            setHeight(0)

            // HACK: fit to the parent element
            setTimeout(() => {
                setWidth(theCanvas.offsetWidth ?? 0)
                setHeight(theCanvas.offsetHeight ?? 0)
                setNeedsRedraw(true)
            }, 100)
        }

        updateSize()

        window.addEventListener('resize', updateSize)

        return () => {
            window.removeEventListener('resize', updateSize)
        }
    }, [canvas])

    React.useEffect(() => {
        if (image === null) {
            return
        }

        loadImages(image, layers)
    }, [image, layers])

    return (
        <canvas
            ref={canvas}
            style={{
                display: 'block',
                backgroundColor: '#000',
                flexGrow: 1,
            }}
            width={width}
            height={height}
        />
    )
}
