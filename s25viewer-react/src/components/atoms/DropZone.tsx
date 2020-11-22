import * as React from 'react'
import { S25 } from 's25-wasm' // eslint-disable-line import/no-unresolved

export interface DropZoneProps {
    onChange?(value: FileList): void
    value?: FileList
}

export default function DropZone(props: DropZoneProps): JSX.Element {
    const [dragEntered, setDragEntered] = React.useState(false)
    const [s25, setS25] = React.useState(null as S25 | null)
    const [name, setName] = React.useState(null as string | null)
    const [ctx, setCtx] = React.useState(
        null as CanvasRenderingContext2D | null,
    )
    const [entry, setEntry] = React.useState(0)

    const canvas = React.useRef(null as HTMLCanvasElement | null)

    React.useEffect(() => {
        setCtx(canvas.current?.getContext('2d') ?? null)

        return () => {
            setCtx(null)
        }
    }, [ctx])

    React.useEffect(() => {
        if (s25 === null || ctx === null) {
            return
        }

        const size = s25.get_size(entry) ?? null
        if (size === null) {
            return
        }

        const decoded = s25.decode_rgba(entry) ?? null
        if (decoded === null) {
            return
        }

        const imageData = new ImageData(new Uint8ClampedArray(decoded), size[0])

        ctx.clearRect(0, 0, 1600, 900)
        ctx.putImageData(imageData, 0, 0)
    }, [s25, ctx, entry])

    return (
        <div>
            <p>
                {(() => {
                    if (s25 === null) {
                        return 'Drop an .S25 image file!'
                    }

                    if (dragEntered) {
                        return 'Drag entered!'
                    }

                    return `${name} has ${s25.total_entries() ?? 'no'} entries`
                })()}
                <input
                    type="text"
                    value={entry}
                    onChange={event => {
                        const value = parseInt(event.target.value, 10)
                        if (!Number.isNaN(value)) {
                            setEntry(value)
                        } else if (event.target.value === '') {
                            setEntry(0)
                        }
                    }}
                />
            </p>
            <canvas
                ref={canvas}
                width={1600}
                height={900}
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

                    const onChange = props.onChange ?? null
                    if (onChange !== null) {
                        onChange(event.dataTransfer.files)
                    }

                    if (s25 !== null) {
                        s25.free()
                        setS25(null)
                    }

                    if (event.dataTransfer.files.length !== 1) {
                        return
                    }

                    const file = event.dataTransfer.files[0]
                    setName(file.name)

                    const fileBuffer = await file.arrayBuffer()
                    const newS25 = S25.open(new Uint8Array(fileBuffer)) ?? null
                    setS25(newS25)
                }}
            />
        </div>
    )
}
