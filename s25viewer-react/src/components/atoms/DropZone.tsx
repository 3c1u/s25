import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { S25 } from 's25-wasm'

export interface DropZoneProps {
    onChange?(value: FileList): void
    value?: FileList
}

const dropZoneStyle = {
    border: '1px solid #ccc',
    backgroundColor: '#fff',
}

export default function DropZone(props: DropZoneProps) {
    const [dragEntered, setDragEntered] = React.useState(false)
    const [s25, setS25] = React.useState(null as S25 | null)
    const [name, setName] = React.useState(null as string | null)
    const [ctx, setCtx] = React.useState(null as CanvasRenderingContext2D | null)

    const canvas = React.useRef(null as HTMLCanvasElement | null)
    React.useEffect(() => {
        setCtx(canvas.current?.getContext('2d') ?? null)

        return (() => {
            setCtx(null)
        })
    })

    return (
        <div>
            <p>
                {(() => {
                    if (s25 === null) {
                        return 'Drop an .S25 image file!'
                    } else {
                        return `${name} has ${s25.total_entries() ?? 'no'} entrie(s)`
                    }
                })()}
            </p>
            <canvas ref={canvas} width={1600} height={900}
                onDragOver={(event => {
                    event.preventDefault()
                    setDragEntered(true)
                })}
                onDragLeave={(event => {
                    event.preventDefault()
                    setDragEntered(false)
                })}
                onDrop={(async event => {
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

                    if (newS25 === null || ctx === null) {
                        console.error('failed to open .S25')
                        return
                    }

                    const size = newS25.get_size(1) ?? null
                    if (size === null) {
                        console.error('cannot obtain size: missing entry?')
                        return
                    }

                    const decoded = newS25.decode_rgba(1) ?? null
                    if (decoded === null) {
                        console.error('cannot obtain buffer: missing entry?')
                        return
                    }

                    const imageData = new ImageData(new Uint8ClampedArray(decoded), size[0])
                    ctx.putImageData(imageData, 0, 0)
                })}>
            </canvas>
        </div>)
}
