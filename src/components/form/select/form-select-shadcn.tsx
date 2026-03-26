"use client";

import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
} from "react-hook-form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SelectInputProps<T extends object> = {
  label: string;
  type?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  testId?: string;
  keyValue: keyof T;
  options: T[];
  size?: "small" | "medium";
  renderOption: (option: T) => React.ReactNode;
  placeholder?: string;
};

function SelectInput<T extends object>(
  props: SelectInputProps<T> & {
    name: string;
    value: T | undefined | null;
    onChange: (value: T) => void;
    onBlur: () => void;
  }
) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.name}>{props.label}</Label>
      <Select
        value={props.value?.[props.keyValue]?.toString() ?? ""}
        onValueChange={(val) => {
          const newValue = props.options.find(
            (option) => option[props.keyValue]?.toString() === val
          );
          if (newValue) {
            props.onChange(newValue);
          }
        }}
        disabled={props.disabled}
      >
        <SelectTrigger
          data-testid={props.testId}
          className={props.error ? "border-destructive" : ""}
        >
          <SelectValue placeholder={props.placeholder ?? props.label} />
        </SelectTrigger>
        <SelectContent>
          {props.options.map((option) => (
            <SelectItem
              key={option[props.keyValue]?.toString()}
              value={option[props.keyValue]?.toString()}
            >
              {props.renderOption(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {props.error && (
        <p
          className="text-sm text-destructive"
          data-testid={`${props.testId}-error`}
        >
          {props.error}
        </p>
      )}
    </div>
  );
}

function FormSelectInput<
  TFieldValues extends FieldValues = FieldValues,
  T extends object = object,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: SelectInputProps<T> &
    Pick<ControllerProps<TFieldValues, TName>, "name" | "defaultValue">
) {
  return (
    <Controller
      name={props.name}
      defaultValue={props.defaultValue}
      render={({ field, fieldState }) => (
        <SelectInput<T>
          {...field}
          label={props.label}
          autoFocus={props.autoFocus}
          type={props.type}
          error={fieldState.error?.message}
          disabled={props.disabled}
          readOnly={props.readOnly}
          testId={props.testId}
          options={props.options}
          renderOption={props.renderOption}
          keyValue={props.keyValue}
          size={props.size}
          placeholder={props.placeholder}
        />
      )}
    />
  );
}

export default FormSelectInput;
