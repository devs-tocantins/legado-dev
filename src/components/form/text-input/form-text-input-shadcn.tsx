"use client";

import { useState } from "react";
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
} from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Eye, EyeOff } from "lucide-react";

export type TextInputProps = {
  label: string;
  type?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  testId?: string;
  autoComplete?: string;
  multiline?: boolean;
  minRows?: number;
  maxRows?: number;
  size?: "small" | "medium";
  placeholder?: string;
};

function TextInput(
  props: TextInputProps & {
    name: string;
    value: string | number;
    onChange: (
      value: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => void;
    onBlur: () => void;
  }
) {
  const [isShowPassword, setIsShowPassword] = useState(false);

  if (props.multiline) {
    return (
      <div className="space-y-2">
        <Label htmlFor={props.name}>{props.label}</Label>
        <Textarea
          id={props.name}
          name={props.name}
          value={props.value ?? ""}
          onChange={props.onChange}
          onBlur={props.onBlur}
          autoFocus={props.autoFocus}
          disabled={props.disabled}
          readOnly={props.readOnly}
          data-testid={props.testId}
          autoComplete={props.autoComplete}
          placeholder={props.placeholder}
          rows={props.minRows ?? 3}
          className={props.error ? "border-destructive" : ""}
        />
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

  return (
    <div className="space-y-2">
      <Label htmlFor={props.name}>{props.label}</Label>
      <div className="relative">
        <Input
          id={props.name}
          name={props.name}
          value={props.value ?? ""}
          onChange={props.onChange}
          onBlur={props.onBlur}
          autoFocus={props.autoFocus}
          type={
            props.type === "password" && isShowPassword ? "text" : props.type
          }
          disabled={props.disabled}
          readOnly={props.readOnly}
          data-testid={props.testId}
          autoComplete={props.autoComplete}
          placeholder={props.placeholder}
          className={props.error ? "border-destructive pr-10" : ""}
        />
        {props.type === "password" && (
          <button
            type="button"
            onClick={() => setIsShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {isShowPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
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

function FormTextInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: Pick<ControllerProps<TFieldValues, TName>, "name" | "defaultValue"> &
    TextInputProps
) {
  return (
    <Controller
      name={props.name}
      defaultValue={props.defaultValue}
      render={({ field, fieldState }) => (
        <TextInput
          {...field}
          label={props.label}
          autoFocus={props.autoFocus}
          type={props.type}
          error={fieldState.error?.message}
          disabled={props.disabled}
          readOnly={props.readOnly}
          testId={props.testId}
          multiline={props.multiline}
          minRows={props.minRows}
          maxRows={props.maxRows}
          autoComplete={props.autoComplete}
          placeholder={props.placeholder}
          size={props.size}
        />
      )}
    />
  );
}

export default FormTextInput;
