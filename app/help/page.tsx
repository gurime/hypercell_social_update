import InfoPage from "../components/info-page";

export default function HelpPage() {
  return (
    <InfoPage
      title="Help & Contact"
      description="Find out how to get help with Hypercell Social."
    >
      <section>
        <h2>What’s available now</h2>
        <p>
          Hypercell Social is in development. You can currently create an
          account or sign in. Posting and community features are still being
          built.
        </p>
      </section>
      <section>
        <h2>Contact support</h2>
        <p>
          A support email address or contact form has not been configured yet.
          Please don’t post passwords or other private account information
          publicly.
        </p>
      </section>
    </InfoPage>
  );
}
