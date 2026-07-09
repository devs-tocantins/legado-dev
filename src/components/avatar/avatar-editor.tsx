import { useState, useMemo, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
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

  const tabsListRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: "left" | "right") => {
    if (tabsListRef.current) {
      const scrollAmount = 150;
      tabsListRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
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
      className={cn("flex flex-col gap-8 w-full max-w-4xl mx-auto", className)}
    >
      {/* Preview */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <AvatarRenderer
            svg={currentSvg}
            size="lg"
            rounded="full"
            className="relative z-10 border border-border"
          />
          <Button
            type="button"
            size="icon"
            onClick={handleRandomize}
            className="absolute bottom-0 right-0 rounded-full z-20 hover:rotate-180 transition-transform duration-500 w-8 h-8"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <div className="mt-4 flex items-center gap-3 bg-muted px-4 py-2 rounded-full">
          <span className="text-[10px] font-medium text-muted-foreground tracking-widest">
            ZOOM
          </span>
          <input
            type="range"
            min="0"
            max="200"
            step="1"
            value={scale}
            onChange={(e) => setScale(parseInt(e.target.value, 10))}
            className="w-32 h-1 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <span className="text-[10px] font-medium text-muted-foreground min-w-[30px]">
            {scale}%
          </span>
        </div>
      </div>

      {/* Category tabs */}
      <div>
        <div className="relative flex items-center">
          <button
            onClick={() => scrollTabs("left")}
            type="button"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-background border border-border shadow-sm text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div
            ref={tabsListRef}
            className="flex gap-2 py-4 overflow-x-auto no-scrollbar bg-transparent scroll-smooth px-8 w-full"
            style={{ scrollbarWidth: "none" }}
          >
            {categories.map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[13px] font-medium transition-all whitespace-nowrap border-none outline-none cursor-pointer select-none flex items-center gap-2",
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                )}
              >
                {CATEGORY_ICONS[cat.id]}
                {cat.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => scrollTabs("right")}
            type="button"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-background border border-border shadow-sm text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="h-[300px] overflow-y-auto p-6">
          {activeCategory === "style" && (
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
              {stylePreviews.map((style) => {
                const isActive = selectedStyle === style.name;

                return (
                  <button
                    type="button"
                    key={style.name}
                    onClick={() => handleStyleChange(style.name)}
                    className={cn(
                      "group relative w-12 h-12 rounded-xl transition-all overflow-hidden",
                      isActive ? "ring-2 ring-primary" : "hover:scale-105"
                    )}
                  >
                    <AvatarRenderer
                      svg={style.svg}
                      size="sm"
                      className="w-full h-full"
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
                className="grid grid-cols-4 sm:grid-cols-8 gap-4"
              >
                {cat.id.toLowerCase().includes("color") && (
                  <div className="relative w-12 h-12">
                    <input
                      type="color"
                      id={`color-picker-${cat.id}`}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                      onChange={(e) =>
                        handleOptionChange(
                          cat.id,
                          e.target.value.replace("#", "")
                        )
                      }
                    />
                    <label
                      htmlFor={`color-picker-${cat.id}`}
                      className="flex items-center justify-center w-full h-full rounded-xl border-2 border-border bg-background cursor-pointer hover:border-primary/40 transition-all overflow-hidden relative"
                    >
                      <div className="w-full h-full bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)] opacity-80" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-white/80 shadow-sm" />
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
                        "relative w-12 h-12 rounded-xl transition-all overflow-hidden",
                        combo.active ? "ring-2 ring-primary" : "hover:scale-105"
                      )}
                    >
                      <AvatarRenderer
                        svg={combo.avatar}
                        size="sm"
                        className="w-full h-full"
                      />

                      {isColor && (
                        <div
                          className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border border-white"
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
