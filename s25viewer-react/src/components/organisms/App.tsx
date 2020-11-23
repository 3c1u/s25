import * as React from 'react'
import { Divider, makeStyles, useMediaQuery, useTheme } from '@material-ui/core'
import ColorPicker from '~/components/molecules/ColorPicker'
import TopBar from '~/components/molecules/TopBar'
import LayerList from '~/components/molecules/LayerList'
import Actions from '~/components/molecules/Actions'
import ImageView from '~/components/molecules/ImageView'

const useStyles = makeStyles(_ => ({
    mainContent: {
        display: 'flex',
        flexDirection: 'row',
        flex: '1',
    },
    layerList: {
        borderLeft: '1px solid',
    },
}))

export default function App(_props: Record<string, unknown>): JSX.Element {
    const theme = useTheme()
    const classes = useStyles()
    const matches = useMediaQuery(theme.breakpoints.up('md'))

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'row',
                width: '100%',
                height: '100%',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    flex: 1,
                }}
            >
                <TopBar />
                <div className={classes.mainContent}>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%',
                            height: '100%',
                        }}
                    >
                        <ImageView />
                        <Actions />
                    </div>
                </div>
            </div>
            <Divider />
            <LayerList drawer={!matches} />
            <ColorPicker />
        </div>
    )
}
