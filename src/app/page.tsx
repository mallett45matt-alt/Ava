import { ButtonLink } from "@/components/ui/Button";
import { CalendarDays, MessageCircleHeart, Receipt, Users } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Customers",
    description: "Every customer's history, notes and upcoming work in one place.",
  },
  {
    icon: CalendarDays,
    title: "Jobs & calendar",
    description: "Day, week and month views. Set a job to repeat and Ava schedules it for you.",
  },
  {
    icon: Receipt,
    title: "Quotes & invoices",
    description: "Turn a completed job into an invoice in a couple of taps.",
  },
  {
    icon: MessageCircleHeart,
    title: "Ask Ava",
    description: "Your AI assistant knows your schedule, quotes and invoices — just ask.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-xl font-semibold tracking-tight">Ava</span>
        <nav className="flex items-center gap-2">
          <ButtonLink href="/login" variant="ghost" size="sm">
            Log in
          </ButtonLink>
          <ButtonLink href="/signup" variant="primary" size="sm">
            Get started
          </ButtonLink>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6">
        <section className="flex flex-col items-start gap-6 py-16 sm:py-24">
          <span className="rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent">
            Built for tradies
          </span>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Your whole business, sorted — with an AI assistant that actually helps.
          </h1>
          <p className="max-w-xl text-lg text-muted">
            Ava brings your customers, jobs, calendar, quotes and invoices into one calm,
            simple app — and keeps track of what needs doing so you don&apos;t have to.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href="/signup" size="lg">
              Start free
            </ButtonLink>
            <ButtonLink href="/login" variant="secondary" size="lg">
              I already have an account
            </ButtonLink>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 pb-24 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
            >
              <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Icon size={20} />
              </div>
              <h2 className="text-base font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted">{description}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center text-sm text-muted">
        Ava — a calmer way to run a trade business.
      </footer>
    </div>
  );
}
