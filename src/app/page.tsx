import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto flex max-w-5xl flex-col gap-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Corsair Hackathon
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">CalyM</h1>
          </div>
          <Button>Connect Gmail + Calendar</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-5">
            <p className="text-sm font-medium text-muted-foreground">Step 1</p>
            <h2 className="mt-2 text-lg font-semibold">App Setup</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Next.js, Tailwind, and shadcn UI are ready for the first screen.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-5">
            <p className="text-sm font-medium text-muted-foreground">Step 2</p>
            <h2 className="mt-2 text-lg font-semibold">Database</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Add your Neon connection string to start using Drizzle.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-5">
            <p className="text-sm font-medium text-muted-foreground">Step 3</p>
            <h2 className="mt-2 text-lg font-semibold">Auth + Corsair</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              BetterAuth will create users, then user ids become Corsair tenants.
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/40 p-5">
          <h2 className="text-lg font-semibold">Current checkpoint</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Put your Neon database URL in <code>.env.local</code>, then run the
            Drizzle push command to create the starter tables.
          </p>
        </div>
      </section>
    </main>
  );
}
