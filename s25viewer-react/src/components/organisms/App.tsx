import * as React from 'react'
import TopBar from '~/components/molecules/TopBar'
import LayerList from '~/components/molecules/LayerList'
import Actions from '~/components/molecules/Actions'
import ImageView from '~/components/molecules/ImageView'

export default function App(_props: Record<string, unknown>): JSX.Element {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
            }}
        >
            <TopBar />
            <ImageView />
            <LayerList />
            <Actions />
        </div>
    )
}
