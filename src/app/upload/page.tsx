import { SiteHeader } from "@/components/site-header";

export default function UploadPage() {
  return (
    <main>
      <SiteHeader />
      <section className="page-shell">
        <fieldset className="plain-fieldset">
          <legend>Upload</legend>
          <p>Upload form goes here.</p>
        </fieldset>
      </section>
    </main>
  );
}
