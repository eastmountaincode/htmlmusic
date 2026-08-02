export default function SketchPage() {
  return (
    <main>
      <section className="page-shell sketch-shell">
        <fieldset className="plain-fieldset">
          <legend>Sketch</legend>
          <p>Development surface for components before they move into the site.</p>
        </fieldset>

        <fieldset className="plain-fieldset">
          <legend>Auth form</legend>
          <form className="auth-form">
            <label>
              email
              <input defaultValue="" type="email" />
            </label>
            <label>
              code
              <input defaultValue="" inputMode="numeric" type="text" />
            </label>
            <div className="auth-actions">
              <button type="button">continue with email</button>
              <button type="button">continue with Google</button>
            </div>
          </form>
        </fieldset>

        <fieldset className="plain-fieldset">
          <legend>Discover item</legend>
          <p>
            Song card placeholder. This is where we can test cover, text, and
            player layout before it touches Discover.
          </p>
        </fieldset>

        <fieldset className="plain-fieldset">
          <legend>Upload form</legend>
          <form className="auth-form">
            <label>
              song title
              <input type="text" />
            </label>
            <label>
              audio file
              <input type="file" />
            </label>
            <button type="button">upload</button>
          </form>
        </fieldset>
      </section>
    </main>
  );
}
