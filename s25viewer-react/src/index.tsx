/// <reference path='./global.d.ts'/>

import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { createStore } from 'redux'
import { Provider } from 'react-redux'

import init from 's25-wasm' // eslint-disable-line import/no-unresolved
import wasm from 's25-wasm/s25_wasm_bg.wasm' // eslint-disable-line import/no-unresolved

import reducer from './reducers'
import App from './components/organisms/App'

const run = async () => {
    await init(wasm)
    const store = createStore(reducer)

    ReactDOM.render(
        <Provider store={store}>
            <App />
        </Provider>,
        document.getElementById('app'),
    )
}

run()
