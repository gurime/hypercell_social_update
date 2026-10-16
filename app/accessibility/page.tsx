import InfoPage from "../components/info-page";

export default function AccessibilityPage() {
  return (
    <InfoPage
      title="Accessibility"
      description="We want Hypercell Social to be usable by as many people as possible."
      draft
    >
      <section>
        <h2>Ongoing work</h2>
        <p>
          The site is still being built. Keyboard access, readable contrast,
          clear labels, and assistive-technology support need to be checked as
          features are added.
        </p>
      </section>
      <section>
        <h2>Need help?</h2>
        <p>
          Accessibility support contact details have not been set up yet. A
          working contact method and a process for handling accessibility
          feedback should be added before public launch.
        </p>
      </section>
    </InfoPage>
  );
}
