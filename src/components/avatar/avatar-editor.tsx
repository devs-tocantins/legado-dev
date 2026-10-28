import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  RefreshCw,
  Palette,
  User,
  Glasses,
  Shirt,
  Eye,
  Smile,
  Paintbrush,
  Pipette,
  Gem,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { availableStyles } from "./config/available-styles";
import { AvatarRenderer } from "./avatar-renderer";
import {
  createAvatar,
  getDefaultOptions,
  getRandomOptions,
  getAvatarCombinations,
} from "./utils/avatar-utils";
import type { SelectedStyleOptions } from "./utils/avatar-utils";

interface AvatarEditorProps {
  initialConfig?: string;
  onChange?: (data: { svg: string; config: string }) => void;
  className?: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  style: <Paintbrush className="w-3.5 h-3.5" />,
  backgroundColor: <Palette className="w-3.5 h-3.5" />,
  top: <User className="w-3.5 h-3.5" />,
  accessories: <Glasses className="w-3.5 h-3.5" />,
  hairColor: <Pipette className="w-3.5 h-3.5" />,
  facialHair: <User className="w-3.5 h-3.5" />,
  facialHairColor: <Pipette className="w-3.5 h-3.5" />,
  clothes: <Shirt className="w-3.5 h-3.5" />,
  clothColor: <Pipette className="w-3.5 h-3.5" />,
  eyes: <Eye className="w-3.5 h-3.5" />,
  eyebrows: <User className="w-3.5 h-3.5" />,
  mouth: <Smile className="w-3.5 h-3.5" />,
  skinColor: <Palette className="w-3.5 h-3.5" />,
  clothing: <Shirt className="w-3.5 h-3.5" />,
  clothingColor: <Pipette className="w-3.5 h-3.5" />,
  hat: <User className="w-3.5 h-3.5" />,
  hatColor: <Pipette className="w-3.5 h-3.5" />,
  body: <User className="w-3.5 h-3.5" />,
  baseColor: <Palette className="w-3.5 h-3.5" />,
  face: <Smile className="w-3.5 h-3.5" />,
  beard: <User className="w-3.5 h-3.5" />,
  details: <Paintbrush className="w-3.5 h-3.5" />,
  glasses: <Glasses className="w-3.5 h-3.5" />,
  headgear: <User className="w-3.5 h-3.5" />,
  headgearColor: <Pipette className="w-3.5 h-3.5" />,
  shirt: <Shirt className="w-3.5 h-3.5" />,
  shirtColor: <Pipette className="w-3.5 h-3.5" />,
  features: <Paintbrush className="w-3.5 h-3.5" />,
  earrings: <Gem className="w-3.5 h-3.5" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  style: "Estilo",
  backgroundColor: "Fundo",
  top: "Cabelo",
  accessories: "Acessórios",
  hairColor: "Cor do cabelo",
  facialHair: "Barba",
  facialHairColor: "Cor da barba",
  clothes: "Roupa",
  clothColor: "Cor da roupa",
  eyes: "Olhos",
  eyebrows: "Sobrancelhas",
  mouth: "Boca",
  skinColor: "Cor da pele",
  clothing: "Roupa",
  clothingColor: "Cor da roupa",
  hat: "Chapéu",
  hatColor: "Cor do chapéu",
  body: "Corpo",
  baseColor: "Cor base",
  face: "Rosto",
  beard: "Barba",
  details: "Detalhes",
  glasses: "Óculos",
  headgear: "Acessório de cabeça",
  headgearColor: "Cor do acessório",
  shirt: "Camisa",
  shirtColor: "Cor da camisa",
  features: "Características",
  earrings: "Brincos",
};

function labelFor(key: string): string {
  if (CATEGORY_LABELS[key]) return CATEGORY_LABELS[key];
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .replace("Probability", "")
    .trim();
}

export function AvatarEditor({
  initialConfig,
  onChange,
  className,
}: AvatarEditorProps) {
  const [selectedStyle, setSelectedStyle] = useState<string>(() => {
    if (initialConfig) {
      try {
        const data = JSON.parse(initialConfig);
        if (data.styleName) return data.styleName;
      } catch {
        return Object.keys(availableStyles)[0];
      }
    }
    return Object.keys(availableStyles)[0];
  });

  const [scale, setScale] = useState<number>(() => {
    if (initialConfig) {
      try {
        const data = JSON.parse(initialConfig);
        if (data.scale) return data.scale;
      } catch {
        return 100;
      }
    }
    return 100;
  });

  const [options, setOptions] = useState<SelectedStyleOptions>(() => {
    if (initialConfig) {
      try {
        const data = JSON.parse(initialConfig);
        if (data.options) return data.options;
      } catch {
        return getDefaultOptions(
          availableStyles[Object.keys(availableStyles)[0]].options
        );
      }
    }
    return getDefaultOptions(
      availableStyles[Object.keys(availableStyles)[0]].options
    );
  });

  const [activeCategory, setActiveCategory] = useState("style");

  const currentSvg = useMemo(
    () => createAvatar(selectedStyle, options, scale),
    [selectedStyle, options, scale]
  );

  const combinations = useMemo(() => {
    return getAvatarCombinations(selectedStyle, options);
  }, [selectedStyle, options]);

  const categories = useMemo(() => {
    const list = [{ id: "style", label: "Estilo" }];
    const styleOptions = availableStyles[selectedStyle].options;

    Object.keys(styleOptions).forEach((key) => {
      list.push({ id: key, label: labelFor(key) });
    });

    return list;
  }, [selectedStyle]);

  useEffect(() => {
    if (onChange) {
      onChange({
        svg: currentSvg,
        config: JSON.stringify({ styleName: selectedStyle, options, scale }),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSvg, selectedStyle, options, scale]);

  const handleRandomize = () => {
    const config = availableStyles[selectedStyle].options;
    setOptions(getRandomOptions(config));
  };

  const handleStyleChange = (styleName: string) => {
    setSelectedStyle(styleName);
    setOptions(getRandomOptions(availableStyles[styleName].options));
  };

  const handleOptionChange = (key: string, value: unknown) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const stylePreviews = useMemo(() => {
    return Object.keys(availableStyles).map((styleName) => ({
      name: styleName,
      svg: createAvatar(
        styleName,
        getDefaultOptions(availableStyles[styleName].options)
      ),
    }));
  }, []);

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full flex-col gap-4 md:flex-row md:gap-6",
        className
      )}
    >
      {/* Painel esquerdo: preview fixo (sem scroll) */}
      <div className="flex shrink-0 flex-row items-center justify-center gap-4 md:w-48 md:flex-col md:justify-start md:pt-1">
        <div className="relative shrink-0">
          <AvatarRenderer
            svg={currentSvg}
            size="lg"
            rounded="full"
            className="relative z-10 h-24 w-24 border border-border md:h-40 md:w-40"
          />
          <Button
            type="button"
            size="icon"
            onClick={handleRandomize}
            aria-label="Gerar avatar aleatório"
            className="absolute bottom-0 right-0 z-20 h-8 w-8 rounded-full transition-transform duration-500 hover:rotate-180"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex w-full max-w-[200px] items-center gap-2 rounded-full bg-muted px-3 py-2 md:max-w-none">
          <span className="text-[10px] font-medium tracking-widest text-muted-foreground">
            ZOOM
          </span>
          <input
            type="range"
            min="0"
            max="200"
            step="1"
            value={scale}
            onChange={(e) => setScale(parseInt(e.target.value, 10))}
            className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-lg bg-border accent-primary"
          />
          <span className="min-w-[32px] text-right text-[10px] font-medium text-muted-foreground">
            {scale}%
          </span>
        </div>
      </div>

      {/* Painel direito: categorias (wrap, sem scroll) + grade (única área com scroll) */}
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              type="button"
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex cursor-pointer select-none items-center gap-1.5 rounded-full border-none px-2.5 py-1 text-xs font-medium outline-none transition-all",
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              {CATEGORY_ICONS[cat.id]}
              {cat.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border bg-muted/20 p-3">
          {activeCategory === "style" && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] gap-2">
              {stylePreviews.map((style) => {
                const isActive = selectedStyle === style.name;

                return (
                  <button
                    type="button"
                    key={style.name}
                    onClick={() => handleStyleChange(style.name)}
                    className={cn(
                      "group relative aspect-square w-full overflow-hidden rounded-xl transition-all",
                      isActive ? "ring-2 ring-primary" : "hover:scale-105"
                    )}
                  >
                    <AvatarRenderer
                      svg={style.svg}
                      size="sm"
                      className="h-full w-full"
                    />
                  </button>
                );
              })}
            </div>
          )}

          {categories
            .filter((c) => c.id !== "style" && c.id === activeCategory)
            .map((cat) => (
              <div
                key={cat.id}
                className="grid grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] gap-2"
              >
                {cat.id.toLowerCase().includes("color") && (
                  <div className="relative aspect-square w-full">
                    <input
                      type="color"
                      id={`color-picker-${cat.id}`}
                      className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
                      onChange={(e) =>
                        handleOptionChange(
                          cat.id,
                          e.target.value.replace("#", "")
                        )
                      }
                    />
                    <label
                      htmlFor={`color-picker-${cat.id}`}
                      className="relative flex h-full w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-border bg-background transition-all hover:border-primary/40"
                    >
                      <div className="h-full w-full bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)] opacity-80" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-4 w-4 rounded-full bg-white/80 shadow-sm" />
                      </div>
                    </label>
                  </div>
                )}

                {combinations[cat.id]?.map((combo, idx) => {
                  const isColor = cat.id.toLowerCase().includes("color");

                  return (
                    <button
                      type="button"
                      key={idx}
                      onClick={() =>
                        handleOptionChange(cat.id, combo.options[cat.id])
                      }
                      className={cn(
                        "relative aspect-square w-full overflow-hidden rounded-xl transition-all",
                        combo.active ? "ring-2 ring-primary" : "hover:scale-105"
                      )}
                    >
                      <AvatarRenderer
                        svg={combo.avatar}
                        size="sm"
                        className="h-full w-full"
                      />

                      {isColor && (
                        <div
                          className="absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full border border-white"
                          style={{
                            backgroundColor: `#${combo.options[cat.id]}`,
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
