export default function Loading() {
  return (
    <div className="w-full h-0.5 overflow-hidden bg-muted">
      <div className="h-full w-1/3 animate-[loading_1s_ease-in-out_infinite] bg-primary" />
    </div>
  );
}
