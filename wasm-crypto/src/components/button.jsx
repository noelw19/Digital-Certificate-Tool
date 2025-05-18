
export function Button({children, noBottomMargin, ...rest}) {
    return <button className={`mt-4 ${noBottomMargin ? "" : "mb-8"} rounded-md shadow-xl/20 bg-white outline-2 outline-black px-3 py-2 text-sm font-semibold hover:text-green-700 text-black hover:translate-y-1 hover:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600`} {...rest}>{children}</button>
}