import * as React from 'react'
// eslint-disable-next-line import/no-unresolved
import { S25 } from 's25-wasm'
import { Layer } from '~/reducers'

interface ImageRendererProps {
    image: S25
    layers: Layer[]
    backgroundColor: string
}

interface LayerCache {
    imageData: ImageData
    offsetX: number
    offsetY: number
}

const createImageBitmapPonyfill =
    window.createImageBitmap ??
    (async (data: ImageData) => {
        return new Promise((resolve, _reject) => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            canvas.width = data.width
            canvas.height = data.height
            ctx?.putImageData(data, 0, 0)
            resolve(canvas)
        })
    })

const redraw = async (
    theCanvas: HTMLCanvasElement,
    theBuffer: HTMLCanvasElement,
    theLayers: LayerCache[],
    theScale: number,
    [theX, theY]: [number, number],
) => {
    const ctx = theBuffer.getContext('2d')
    const pctx = theCanvas.getContext('2d')

    if (ctx === null || pctx == null) {
        return
    }

    ctx.resetTransform()
    ctx.clearRect(0, 0, theCanvas.width, theCanvas.height)
    ctx.translate(theX, theY)
    ctx.scale(theScale, theScale)

    const ls = await Promise.all(
        theLayers.map(async l => {
            const bitmap = await createImageBitmapPonyfill(l.imageData)
            return { ...l, bitmap }
        }),
    )

    ls.forEach(l => {
        const { bitmap, offsetX, offsetY } = l
        ctx.drawImage(bitmap, offsetX, offsetY)
        if (bitmap.close !== undefined) {
            bitmap.close()
        }
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

    return cachedLayers.filter(v => v !== null) as LayerCache[]
}

export default function ImageRenderer({
    image,
    layers,
    backgroundColor,
}: ImageRendererProps): JSX.Element {
    const [width, setWidth] = React.useState(1)
    const [height, setHeight] = React.useState(1)
    const [x, setX] = React.useState(0)
    const [y, setY] = React.useState(0)
    const [scale, setScale] = React.useState(0.5)
    const [oldScale, setOldScale] = React.useState(1.0)

    const [isDragging, setDragging] = React.useState(false)
    const [oldX, setOldX] = React.useState(0)
    const [oldY, setOldY] = React.useState(0)

    const [needsRedraw, setNeedsRedraw] = React.useState(true)
    const [layerCache, setLayerCache] = React.useState([] as LayerCache[])

    const canvas = React.useRef(null as HTMLCanvasElement | null)
    const [bufferCanvas, setBufferCanvas] = React.useState(
        null as HTMLCanvasElement | null,
    )

    React.useEffect(() => {
        setBufferCanvas(document.createElement('canvas'))
    }, [])

    const reqId = React.useRef(null as number | null)

    const redrawCallback = React.useCallback(() => {
        const theCanvas = canvas.current
        if (theCanvas === null || bufferCanvas === null) {
            return
        }

        if (!needsRedraw) {
            return
        }

        if (reqId.current === null) {
            reqId.current = window.requestAnimationFrame(redrawCallback)
            return
        }

        reqId.current = null

        if (bufferCanvas.width !== width || bufferCanvas.height !== height) {
            bufferCanvas.width = width
            bufferCanvas.height = height
        }

        setNeedsRedraw(false)
        redraw(theCanvas, bufferCanvas, layerCache, scale, [x, y])
    }, [
        needsRedraw,
        canvas,
        reqId,
        bufferCanvas,
        layerCache,
        scale,
        width,
        height,
        x,
        y,
    ])

    React.useEffect(() => {
        reqId.current = window.requestAnimationFrame(redrawCallback)
        return () => {
            if (reqId.current !== null) {
                window.cancelAnimationFrame(reqId.current)
            }
        }
    }, [redrawCallback, reqId])

    const handleGesture = React.useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (event: any) => {
            event.preventDefault()

            const theScale = event.scale ?? 1.0
            const deltaScale = theScale / oldScale
            const newScale = scale * deltaScale

            const deltaX = event.pageX - oldX
            const deltaY = event.pageY - oldY

            const newX = x + deltaX
            const newY = y + deltaY

            setOldX(event.pageX)
            setOldY(event.pageY)

            setX(event.pageX + (newX - event.pageX) * deltaScale)
            setY(event.pageY + (newY - event.pageY) * deltaScale)

            setScale(newScale)
            setOldScale(theScale)
            setNeedsRedraw(true)
        },
        [scale, oldScale, x, y, oldX, oldY],
    )

    React.useEffect(() => {
        const theCanvas = canvas.current
        if (theCanvas === null) {
            return () => {
                // do nothing
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const gestureStart = (event: any) => {
            event.preventDefault()
            const theScale = event.scale ?? 1.0
            setOldScale(theScale)
            setOldX(event.pageX)
            setOldY(event.pageY)
        }
        const gestureChange = (event: Event) => handleGesture(event)
        const gestureEnd = (event: Event) => event.preventDefault()

        theCanvas.addEventListener('gesturestart', gestureStart, false)
        theCanvas.addEventListener('gesturechange', gestureChange, false)
        theCanvas.addEventListener('gestureend', gestureEnd, false)

        return () => {
            theCanvas.removeEventListener('gesturestart', gestureStart, false)
            theCanvas.removeEventListener('gesturechange', gestureChange, false)
            theCanvas.removeEventListener('gestureend', gestureEnd, false)
        }
    }, [canvas, handleGesture])

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
        const loadImageCache = async () => {
            if (image === null) {
                return
            }

            const theLayerCache = await loadImages(image, layers)
            setLayerCache(theLayerCache)
            setNeedsRedraw(true)
        }

        loadImageCache()
    }, [image, layers])

    return (
        <canvas
            ref={canvas}
            style={{
                display: 'block',
                backgroundColor,
                flexGrow: 1,
                zIndex: 0,
            }}
            width={width}
            height={height}
            onWheel={event => {
                event.preventDefault()

                if (event.deltaX === 0 && event.deltaY === 0) {
                    return
                }

                if (event.ctrlKey || event.altKey) {
                    const scaleDelta =
                        1.0 +
                        Math.min(Math.max(0.003 * event.deltaY, -0.2), 0.2)

                    setX(event.clientX + (x - event.clientX) * scaleDelta)
                    setY(event.clientY + (y - event.clientY) * scaleDelta)
                    setScale(scale * scaleDelta)
                    setNeedsRedraw(true)
                    return
                }

                setX(x - 2.0 * event.deltaX)
                setY(y - 2.0 * event.deltaY)

                setNeedsRedraw(true)
            }}
            onMouseDown={event => {
                event.preventDefault()
                setDragging(true)
                setOldX(event.clientX)
                setOldY(event.clientY)
            }}
            onMouseMove={event => {
                if (!isDragging) {
                    return
                }

                const deltaX = event.clientX - oldX
                const deltaY = event.clientY - oldY

                setX(x + deltaX)
                setY(y + deltaY)

                setOldX(event.clientX)
                setOldY(event.clientY)

                setNeedsRedraw(true)
            }}
            onMouseUp={event => {
                event.preventDefault()
                setDragging(false)
            }}
            onMouseOut={_ => {
                setDragging(false)
            }}
            onBlur={_ => {
                setDragging(false)
            }}
        />
    )
}
