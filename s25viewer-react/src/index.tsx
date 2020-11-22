/// <reference path='./global.d.ts'/>

import * as React from 'react'
import * as ReactDOM from 'react-dom'

import init from 's25-wasm'
import wasm from 's25-wasm/s25_wasm_bg.wasm'

import DropZone from './components/atoms/DropZone'

(async () => {
    await init(wasm)

    ReactDOM.render(
        <div>
            <DropZone />
        </div>,
        document.getElementById('app'),
    )
})()
