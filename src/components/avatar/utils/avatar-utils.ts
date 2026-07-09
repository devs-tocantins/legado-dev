import { createAvatar as createAvatarCore } from "@dicebear/core";
import { availableStyles } from "../config/available-styles";
import type { ConfigStyleOptions } from "../config/available-styles";

export type SelectedStyleOptions = Record<string, unknown>;

export function createAvatar(
  styleName: string,
  options: SelectedStyleOptions,
  scale: number = 100
) {
  const style = availableStyles[styleName];
  if (!style) return "";

  const dicebearOptions: Record<string, unknown> = {
    size: 512,
    scale,
  };

  for (const key in options) {
    const value = options[key];
    const config = style.options[key];

    if (config?.isArray) {
      dicebearOptions[key] = value ? [value] : [];
    } else {
      dicebearOptions[key] = value;
    }

    if (config?.hasProbability) {
      dicebearOptions[`${key}Probability`] = value ? 100 : 0;
    }
  }

  return createAvatarCore(style.style as never, dicebearOptions).toString();
}

export function getRandomOptions(
  configOptions: ConfigStyleOptions
): SelectedStyleOptions {
  const result: SelectedStyleOptions = {};

  for (const key in configOptions) {
    const styleOption = configOptions[key];
    const values = styleOption.values;

    if (Math.random() * 100 <= styleOption.probability) {
      const possibleValues = values.filter((v) => v !== "");
      result[key] =
        possibleValues[Math.floor(Math.random() * possibleValues.length)];
    } else {
      result[key] = values[0];
    }
  }

  return result;
}

export function getDefaultOptions(
  configOptions: ConfigStyleOptions
): SelectedStyleOptions {
  const result: SelectedStyleOptions = {};

  for (const key in configOptions) {
    result[key] = configOptions[key].values[0];
  }

  return result;
}

export interface Combination {
  avatar: string;
  options: SelectedStyleOptions;
  active: boolean;
}

export function getAvatarCombinations(
  styleName: string,
  currentOptions: SelectedStyleOptions
): Record<string, Combination[]> {
  const combinations: Record<string, Combination[]> = {};
  const style = availableStyles[styleName];
  if (!style) return {};

  for (const key in style.options) {
    combinations[key] = [];
    const config = style.options[key];

    for (const value of config.values) {
      const options = { ...currentOptions, [key]: value };
      combinations[key].push({
        avatar: createAvatar(styleName, options),
        options,
        active: currentOptions[key] === value,
      });
    }
  }

  return combinations;
}
