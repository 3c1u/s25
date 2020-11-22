declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.svg'

declare module '*.styl' {
    interface IClassNames {
        [className: string]: string
    }
    const classNames: IClassNames
    export = classNames
}
