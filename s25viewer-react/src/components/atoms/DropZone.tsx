import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { S25 } from 's25-wasm'

export interface DropZoneProps {
    onChange?(value: FileList): void
    value?: FileList
}

const dropZoneStyle = {
    width: '300px',
    height: '300px',
    border: '1px solid #ccc',
    backgroundColor: '#fff',
}

const dropZoneStyleDragged = {
    backgroundColor: '#ccc',
}

export default function DropZone(props: DropZoneProps) {
    const [dragEntered, setDragEntered] = React.useState(false)
    const [s25, setS25] = React.useState(null as S25 | null)
    const [name, setName] = React.useState(null as string | null)

    return (<div style={{ ...dropZoneStyle, ...(dragEntered ? dropZoneStyleDragged : {}) }}
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
                const newS25 = S25.open(new Int8Array(fileBuffer)) ?? null
                
                setS25(newS25)
            })}>
        {(() => {
            if (s25 === null) {
                return 'Drop an .S25 image file!'
            } else {
                return `${name} has ${s25.total_entries() ?? 'no'} entrie(s)`
            }
        })()}
    </div>)
}
