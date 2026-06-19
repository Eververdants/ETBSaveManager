type ScreenMock = {
  id: string;
  title: string;
  description: string;
};

const screens: readonly ScreenMock[] = [
  { id: "archive-list", title: "Archive List", description: "Browse, search, and sort every save." },
  { id: "create-archive", title: "Create Archive", description: "Three-step wizard for new saves." },
  { id: "edit-archive", title: "Edit Archive", description: "Tweak inventory, sanity, and player data." },
];

export function ScreensSection(): React.JSX.Element {
  return (
    <section id="screens" className="bg-slate-50 px-4 py-20 dark:bg-slate-900/50">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
          See it in action
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600 dark:text-slate-400">
          A snapshot of the three main views — all abstract, no real assets, every pixel a CSS primitive.
        </p>
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {screens.map((screen) => (
            <article
              key={screen.id}
              data-testid="screen-card"
              aria-label={screen.title}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
            >
              <ScreenMock id={screen.id} />
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-50">
                {screen.title}
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{screen.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScreenMock({ id }: { id: string }): React.JSX.Element {
  // 窗口框：标题栏 + 内容区占位条
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-100 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">{id}</span>
      </div>
      <div className="space-y-2 p-3">
        {id === "archive-list" && <ListMock />}
        {id === "create-archive" && <WizardMock />}
        {id === "edit-archive" && <EditorMock />}
      </div>
    </div>
  );
}

function ListMock(): React.JSX.Element {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-slate-200 dark:bg-slate-800" />
          <div className="h-2 flex-1 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-2 w-12 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      ))}
    </>
  );
}

function WizardMock(): React.JSX.Element {
  return (
    <>
      <div className="flex gap-1.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-1.5 flex-1 rounded bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
      <div className="h-16 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-6 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
    </>
  );
}

function EditorMock(): React.JSX.Element {
  return (
    <>
      <div className="flex gap-1.5">
        <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square rounded bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
    </>
  );
}
