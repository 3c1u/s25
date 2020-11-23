import * as React from 'react'
// eslint-disable-next-line import/no-unresolved
import { S25 } from 's25-wasm'
import { Layer, useSelector } from '~/reducers'

interface ImageRendererProps {
    image: S25
}

interface LayerCache {
    imageData: ImageData
    offsetX: number
    offsetY: number
}

export default function ImageRenderer(_props: ImageRendererProps): JSX.Element {
    const [width, setWidth] = React.useState(1)
    const [height, setHeight] = React.useState(1)
    const [scale, setScale] = React.useState(0.5)
    const [needsRedraw, setNeedsRedraw] = React.useState(true)
    const [layerCache, setLayerCache] = React.useState([] as LayerCache[])

    const canvas = React.useRef(null as HTMLCanvasElement | null)
    const [bufferCanvas, setBufferCanvas] = React.useState(
        null as HTMLCanvasElement | null,
    )

    const [image, layers] = useSelector(s => [s.image, s.layers])

    const redraw = async (
        theCanvas: HTMLCanvasElement,
        theBuffer: HTMLCanvasElement,
        theLayers: LayerCache[],
        theScale: number,
    ) => {
        const ctx = theBuffer.getContext('2d')
        const pctx = theCanvas.getContext('2d')

        if (ctx === null || pctx == null) {
            return
        }

        ctx.resetTransform()
        ctx.clearRect(0, 0, theCanvas.width, theCanvas.height)
        ctx.scale(theScale, theScale)

        const ls = await Promise.all(
            theLayers.map(async l => {
                const bitmap = await createImageBitmap(l.imageData)
                return { ...l, bitmap }
            }),
        )

        ls.forEach(l => {
            const { bitmap, offsetX, offsetY } = l
            ctx.drawImage(bitmap, offsetX, offsetY)
            bitmap.close()
        })

        pctx.putImageData(
            ctx.getImageData(0, 0, theCanvas.width, theCanvas.height),
            0,
            0,
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

                    return { imageData, offsetX, offsetY }
                },
            ),
        )

        setLayerCache(cachedLayers.filter(v => v !== null) as LayerCache[])
        setNeedsRedraw(true)
    }

    React.useEffect(() => {
        setBufferCanvas(document.createElement('canvas'))
    }, [])

    React.useEffect(() => {
        const theCanvas = canvas.current
        if (theCanvas === null || bufferCanvas === null) {
            return
        }

        if (needsRedraw) {
            setNeedsRedraw(false)
            bufferCanvas.width = width
            bufferCanvas.height = height
            redraw(theCanvas, bufferCanvas, layerCache, scale)
        }
    }, [needsRedraw, canvas, bufferCanvas, layerCache, scale, width, height])

    React.useEffect(() => {
        const theCanvas = canvas.current
        if (theCanvas === null) {
            return () => {
                // do nothing
            }
        }

        const updateSize = () => {
            setWidth(1)
            setHeight(1)

            // HACK: fit to the parent element
            setTimeout(() => {
                setWidth(theCanvas.offsetWidth ?? 1)
                setHeight(theCanvas.offsetHeight ?? 1)
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
            onWheel={event => {
                event.preventDefault()
                setScale(scale * 1.03 ** event.deltaY)
                setNeedsRedraw(true)
            }}
        />
    )
}
