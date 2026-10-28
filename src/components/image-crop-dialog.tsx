"use client";

import { useCallback, useState, type ComponentType } from "react";
import CropperImport, { Area, CropperProps } from "react-easy-crop";

// react-easy-crop ships types built against an older React version, which
// clashes with React 19's stricter JSX component typing. The component
// itself fills in defaults for the props we don't pass explicitly.
const Cropper = CropperImport as unknown as ComponentType<
  Partial<CropperProps>
>;
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getCroppedImageBlob } from "@/lib/crop-image";
import { ZoomIn } from "lucide-react";

type ImageCropDialogProps = {
  open: boolean;
  imageSrc: string | null;
  outputSize?: number;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
};

export function ImageCropDialog({
  open,
  imageSrc,
  outputSize = 512,
  onCancel,
  onConfirm,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImageBlob(
        imageSrc,
        croppedAreaPixels,
        outputSize
      );
      onConfirm(blob);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajustar foto de perfil</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative h-72 w-full rounded-md overflow-hidden bg-muted">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            )}
          </div>

          <div className="flex items-center gap-3">
            <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={processing || !croppedAreaPixels}
            >
              {processing ? "Processando..." : "Usar esta foto"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
