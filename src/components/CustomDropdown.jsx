import React, { useState, useRef, useEffect } from "react";

/**
 * CustomDropdown - a reusable dropdown styled to match the username dropdown in NavigationBar.
 * Props:
 *  - options: array of { value, label }
 *  - value: selected value
 *  - onChange: function(newValue)
 *  - placeholder: string
 *  - required: boolean
 *  - className: string (optional)
 */
export default function CustomDropdown({
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  required = false,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Keyboard navigation
  const [highlighted, setHighlighted] = useState(-1);
  useEffect(() => {
    if (!open) setHighlighted(-1);
  }, [open, options]);

  function handleKeyDown(e) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      setHighlighted((h) => (h + 1) % options.length);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setHighlighted((h) => (h - 1 + options.length) % options.length);
      e.preventDefault();
    } else if (e.key === "Enter" || e.key === " ") {
      if (highlighted >= 0 && highlighted < options.length) {
        onChange(options[highlighted].value);
        setOpen(false);
      }
      e.preventDefault();
    } else if (e.key === "Escape") {
      setOpen(false);
      e.preventDefault();
    }
  }

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={ref} className={`relative ${className}`} tabIndex={0} onKeyDown={handleKeyDown}>
      <button
        type="button"
        className="font-bold text-lg px-3 py-2 rounded bg-pink-50 text-primary shadow-md border border-primary flex items-center gap-2 focus:outline-none w-full justify-between"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        tabIndex={0}
      >
        <span className={selectedOption ? "" : "text-gray-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <i className={`fi fi-rr-angle-${open ? "up" : "down"} text-base ml-2`}></i>
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-full bg-white border border-primary rounded shadow-lg z-50">
          <ul
            className="max-h-60 overflow-y-auto"
            role="listbox"
            tabIndex={-1}
          >
            {options.map((opt, idx) => (
              <li
                key={opt.value}
                className={`block px-4 py-2 text-primary cursor-pointer transition-all ${
                  highlighted === idx ? "bg-pink-50" : "hover:bg-pink-50"
                } ${value === opt.value ? "font-semibold" : ""}`}
                role="option"
                aria-selected={value === opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                onMouseEnter={() => setHighlighted(idx)}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
      {required && !value && (
        <input tabIndex={-1} style={{ opacity: 0, width: 0, height: 0, position: "absolute" }} required readOnly />
      )}
    </div>
  );
} 