import * as collection from "@dicebear/collection";
import type { Style, StyleSchema } from "@dicebear/core";

export interface DiceBearSchemaProperty {
  type?: string;
  enum?: unknown[];
  default?: unknown;
  items?: {
    type?: string;
    enum?: unknown[];
    pattern?: string;
  };
}

export interface ConfigStyleOption {
  hasProbability?: boolean;
  probability: number;
  isColor?: boolean;
  isArray?: boolean;
  values: string[];
}

export type ConfigStyleOptions = Record<string, ConfigStyleOption>;

export interface ConfigStyle {
  style: Style<Record<string, unknown>>;
  options: ConfigStyleOptions;
}

export type ConfigProperty = {
  [key: string]: unknown;
};

export const availableStyles: Record<string, ConfigStyle> = {
  adventurer: {
    style: collection.adventurer,
    options: getSchemaOptions(collection.adventurer.schema ?? {}),
  },
  adventurerNeutral: {
    style: collection.adventurerNeutral,
    options: getSchemaOptions(collection.adventurerNeutral.schema ?? {}),
  },
  avataaars: {
    style: collection.avataaars,
    options: getSchemaOptions(collection.avataaars.schema ?? {}),
  },
  avataaarsNeutral: {
    style: collection.avataaarsNeutral,
    options: getSchemaOptions(collection.avataaarsNeutral.schema ?? {}),
  },
  bigEars: {
    style: collection.bigEars,
    options: getSchemaOptions(collection.bigEars.schema ?? {}),
  },
  bigSmile: {
    style: collection.bigSmile,
    options: getSchemaOptions(collection.bigSmile.schema ?? {}),
  },
  bottts: {
    style: collection.bottts,
    options: getSchemaOptions(collection.bottts.schema ?? {}),
  },
  croodles: {
    style: collection.croodles,
    options: getSchemaOptions(collection.croodles.schema ?? {}),
  },
  funEmoji: {
    style: collection.funEmoji,
    options: getSchemaOptions(collection.funEmoji.schema ?? {}),
  },
  lorelei: {
    style: collection.lorelei,
    options: getSchemaOptions(collection.lorelei.schema ?? {}),
  },
  micah: {
    style: collection.micah,
    options: getSchemaOptions(collection.micah.schema ?? {}),
  },
  notionists: {
    style: collection.notionists,
    options: getSchemaOptions(collection.notionists.schema ?? {}),
  },
  openPeeps: {
    style: collection.openPeeps,
    options: getSchemaOptions(collection.openPeeps.schema ?? {}),
  },
  personas: {
    style: collection.personas,
    options: getSchemaOptions(collection.personas.schema ?? {}),
  },
  pixelArt: {
    style: collection.pixelArt,
    options: getSchemaOptions(collection.pixelArt.schema ?? {}),
  },
  pixelArtNeutral: {
    style: collection.pixelArtNeutral,
    options: getSchemaOptions(collection.pixelArtNeutral.schema ?? {}),
  },
  botttsNeutral: {
    style: collection.botttsNeutral,
    options: getSchemaOptions(collection.botttsNeutral.schema ?? {}),
  },
  croodlesNeutral: {
    style: collection.croodlesNeutral,
    options: getSchemaOptions(collection.croodlesNeutral.schema ?? {}),
  },
  thumbs: {
    style: collection.thumbs,
    options: getSchemaOptions(collection.thumbs.schema ?? {}),
  },
  shapes: {
    style: collection.shapes,
    options: getSchemaOptions(collection.shapes.schema ?? {}),
  },
  initials: {
    style: collection.initials,
    options: getSchemaOptions(collection.initials.schema ?? {}),
  },
  identicon: {
    style: collection.identicon,
    options: getSchemaOptions(collection.identicon.schema ?? {}),
  },
};

function getSchemaOptions(schema: StyleSchema): ConfigStyleOptions {
  const result: ConfigStyleOptions = {};
  const properties: ConfigProperty = {
    backgroundColor: {
      type: "array",
      items: {
        type: "string",
        pattern: "^(transparent|[a-fA-F0-9]{6})$",
      },
    },
    ...schema.properties,
  };

  for (const key in properties) {
    if (key === "style") continue;

    const rawProperty = properties[key];
    if (typeof rawProperty === "boolean") continue;

    const property = rawProperty as DiceBearSchemaProperty;

    const isColor = !!key.match(/Color$/);
    const isArray = property.type === "array";
    const isBackgroundColor = key === "backgroundColor";

    const probability = properties[`${key}Probability`] as
      | { default?: number }
      | undefined;
    const hasProbability =
      typeof probability === "object" && probability !== null;

    const values = new Set<string>();
    if (hasProbability) values.add("");

    if (property.enum) {
      for (const value of property.enum) {
        if (typeof value === "string") values.add(value);
      }
    }

    if (property.default && Array.isArray(property.default)) {
      for (const value of property.default) {
        if (typeof value === "string") values.add(value);
      }
    }

    if (
      typeof property.items === "object" &&
      !Array.isArray(property.items) &&
      property.items.enum
    ) {
      for (const value of property.items.enum) {
        if (typeof value === "string") values.add(value);
      }
    }

    if (values.size <= 1 && !isBackgroundColor) continue;

    if (isBackgroundColor && values.size <= 1) {
      ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf"].forEach((c) => {
        values.add(c);
      });
    }

    result[key] = {
      values: Array.from(values.values()),
      isColor,
      isArray,
      hasProbability,
      probability:
        hasProbability && probability?.default !== undefined
          ? probability.default
          : 100,
    };
  }

  return result;
}
