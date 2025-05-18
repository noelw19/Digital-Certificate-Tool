
export function Page({title, children}) {
    return (
        <div className="h-[90%] flex flex-col justify-start items-center gap-4 text-black overflow-scroll">
            <p className="text-2xl">{title}</p>
            {children}
        </div>
    )
}