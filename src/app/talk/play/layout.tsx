export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return <div data-surface="game" className="contents">{children}</div>;
}
