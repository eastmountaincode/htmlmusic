export default function AboutPage() {
  return (
    <main>
      <section className="page-shell">
        <fieldset className="plain-fieldset">
          <legend>About</legend>
          <p>HTML Music is a place to share recordings and discover music.</p>
        </fieldset>
        <p className="about-bug-report">
          <a href="mailto:andreweboylan@gmail.com">
            report a bug / suggest a feature
          </a>
        </p>
      </section>
    </main>
  );
}
