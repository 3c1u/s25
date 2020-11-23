import * as React from 'react'
import TopBar from '~/components/organisms/TopBar'
import LayerList from '~/components/organisms/LayerList'
import Actions from '~/components/molecules/Actions'

export default function App(_props: Record<string, unknown>): JSX.Element {
    return (
        <div>
            <TopBar />
            <LayerList />
            <Actions />
        </div>
    )
}
