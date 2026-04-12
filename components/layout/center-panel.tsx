export function CenterPanel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex min-h-screen w-full max-w-[52rem] flex-col px-6 py-8 lg:px-12">
        {children}
      </div>
    </main>
  );
}
