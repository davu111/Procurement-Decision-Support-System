import { useState, useRef, useEffect } from "react";
import { Input } from "../../components/ui/input";

export function AutocompleteInput({
  options,
  value,
  onChange,
  onSelect,
  placeholder,
  className,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (value.length > 0) {
      const filtered = options.filter((option) =>
        option.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(filtered);
      setIsOpen(filtered.length > 0);
    } else {
      setFilteredOptions([]);
      setIsOpen(false);
    }
  }, [value, options]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
      {isOpen && filteredOptions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-auto">
          {filteredOptions.map((option) => (
            <li
              key={option.id}
              className="px-3 py-2 cursor-pointer hover:bg-accent text-sm"
              onClick={() => {
                onSelect(option);
                onChange(option.name);
                setIsOpen(false);
              }}
            >
              {option.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AutocompleteInput;
