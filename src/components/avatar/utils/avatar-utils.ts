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

export function svgToPngFile(
  svg: string,
  fileName: string = "avatar.png",
  size: number = 512
): Promise<File> {
  return new Promise((resolve, reject) => {
    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas 2D context unavailable"));
        return;
      }
      ctx.drawImage(image, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Falha ao gerar PNG do avatar"));
          return;
        }
        resolve(new File([blob], fileName, { type: "image/png" }));
      }, "image/png");
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Falha ao carregar o SVG do avatar"));
    };
    image.src = url;
  });
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
