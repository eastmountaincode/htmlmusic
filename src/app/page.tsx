import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <main>
      <SiteHeader />
      <section className="page-shell">
        <fieldset className="plain-fieldset">
          <legend>River</legend>
          <p>No songs yet.</p>
        </fieldset>
      </section>
    </main>
  );
}
