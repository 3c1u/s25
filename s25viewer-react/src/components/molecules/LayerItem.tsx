import React, { ChangeEvent } from 'react'
import {
    ListItem,
    ListItemIcon,
    ListItemSecondaryAction,
    ListItemText,
    IconButton,
    Select,
    MenuItem,
} from '@material-ui/core'

import VisibleIcon from '@material-ui/icons/Visibility'
import VisibleOffIcon from '@material-ui/icons/VisibilityOff'

interface LayerItemProps {
    name?: string
    visible?: boolean
    value?: number
    onVisiblilityChange?(value: boolean): void
    onChange?(value: number): void
}

export default function LayerItem({
    name: propsName = 'Layer',
    visible: propsVisible,
    value: propsValue,
    onVisiblilityChange,
    onChange,
}: LayerItemProps): JSX.Element {
    const [visible, setVisible] = React.useState(true)
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState(-1)

    React.useEffect(() => {
        if (propsVisible !== undefined) {
            setVisible(propsVisible)
        }

        if (propsValue !== undefined) {
            setValue(propsValue)
        }
    }, [propsVisible, propsValue])

    return (
        <ListItem dense>
            <ListItemIcon>
                <IconButton
                    edge="start"
                    aria-label="visible"
                    onClick={() => {
                        setVisible(!visible)
                        if (onVisiblilityChange !== undefined) {
                            onVisiblilityChange(!visible)
                        }
                    }}
                >
                    {propsVisible ?? visible ? (
                        <VisibleIcon />
                    ) : (
                        <VisibleOffIcon />
                    )}
                </IconButton>
            </ListItemIcon>
            <ListItemText primary={propsName} />
            <ListItemSecondaryAction>
                <Select
                    labelId="demo-controlled-open-select-label"
                    id="demo-controlled-open-select"
                    open={open}
                    onClose={() => setOpen(false)}
                    onOpen={() => setOpen(true)}
                    value={value}
                    onChange={event => {
                        const newValue = Number(event.target.value)
                        setValue(newValue)
                        if (onChange !== undefined) {
                            onChange(newValue)
                        }
                    }}
                >
                    <MenuItem value={-1} disabled>
                        <em>Select...</em>
                    </MenuItem>
                    {Array.from(Array(10), (_, k) => (
                        <MenuItem value={k} key={k}>
                            {`${k}`}
                        </MenuItem>
                    ))}
                </Select>
            </ListItemSecondaryAction>
        </ListItem>
    )
}
