/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference path='./global.d.ts'/>

import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles'
import { teal } from '@material-ui/core/colors'
import { CssBaseline } from '@material-ui/core'

import { createStore } from 'redux'
import { Provider } from 'react-redux'

import init from 's25-wasm' // eslint-disable-line import/no-unresolved
import wasm from 's25-wasm/s25_wasm_bg.wasm' // eslint-disable-line import/no-unresolved

import reducer from './reducers'
import App from './components/organisms/App'

const theme = createMuiTheme({
    palette: {
        primary: {
            main: '#ec407a',
        },
        secondary: teal,
        type: 'dark',
    },
})

// HACK: for Safari; this disables bounce-back scroll effect
document.ontouchmove = event => {
    event.preventDefault()
}

document.addEventListener(
    'gesturestart',
    event => event.preventDefault(),
    false,
)
document.addEventListener(
    'gesturechange',
    event => event.preventDefault(),
    false,
)

document.addEventListener('gestureend', event => event.preventDefault(), false)

// HACK: for iOS Safari; this hides the address bar
setTimeout(() => {
    window.scrollTo(0, 1)
}, 1000)

const run = async () => {
    await init(wasm)
    const store = createStore(reducer)

    ReactDOM.render(
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <App />
            </ThemeProvider>
        </Provider>,
        document.getElementById('app'),
    )
}

run()
