import { useDeferredValue, useEffect, useState } from "react";
import { Input, InputProps } from "./ui/input";

export function DeferredInput({
  value: initialValue,
  onChange,
  debounce = 1000,
  ...props
}: {
  value: string;
  onChange: (value: string) => void;
  debounce?: number;
} & Omit<InputProps, "onChange">) {
  const [value, setValue] = useState(initialValue);
  const deferredQuery = useDeferredValue(value);

  useEffect(() => {
    onChange(deferredQuery);
  }, [onChange, deferredQuery]);

  return (
    <Input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
