import Link from "next/link";
import InfoPage from "../components/info-page";

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms of Service"
      description="Starter terms for using Hypercell Social."
      draft
    >
      <section>
        <h2>Using an account</h2>
        <p>
          Keep your account information accurate and take reasonable steps to
          protect access to your account. The final terms should explain account
          eligibility, account security, and how accounts may be closed.
        </p>
      </section>
      <section>
        <h2>Content and conduct</h2>
        <p>
          You are responsible for content you submit and should only share
          material you have the right to use. Follow the{" "}
          <Link
            className="font-medium text-blue-700 underline hover:text-blue-900"
            href="/community-guidelines"
          >
            Community Guidelines
          </Link>{" "}
          when participating.
        </p>
      </section>
      <section>
        <h2>Service rules still to define</h2>
        <p>
          These starter terms do not yet define content licenses, moderation
          and appeals, service availability, liability, dispute handling,
          governing law, or how changes to the terms will be communicated. Those
          details must be reviewed and completed before public launch.
        </p>
      </section>
    </InfoPage>
  );
}
