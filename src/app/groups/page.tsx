import { SiteHeader } from "@/components/site-header";

export default function GroupsPage() {
  return (
    <main>
      <SiteHeader />
      <section className="page-shell">
        <fieldset className="plain-fieldset">
          <legend>Groups</legend>
          <p>no groups yet</p>
        </fieldset>
      </section>
    </main>
  );
}
