export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return <div data-surface="game" className="mx-auto w-full max-w-lg">{children}</div>;
}
