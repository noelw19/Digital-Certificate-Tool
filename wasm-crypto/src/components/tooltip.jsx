
export const WithTooltip = ({ tooltip, children }) => {
    return (
      <div className="relative group block cursor-help">
        {children}
        <div className="w-[250px] absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden wrap-break-word rounded bg-gray-800 px-3 py-2 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100 group-hover:block z-50">
          {tooltip}
        </div>
      </div>
    );
  };