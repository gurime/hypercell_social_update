import Link from "next/link";
import InfoPage from "../components/info-page";

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      description="A starter overview of account information for Hypercell Social."
      draft
    >
      <section>
        <h2>Information used to create an account</h2>
        <p>
          The current sign-up form requests an email address, a password, and a
          full name. Account sign-in is provided through Supabase Auth, and the
          full name is submitted as account metadata.
        </p>
      </section>
      <section>
        <h2>How information is handled</h2>
        <p>
          The service uses Supabase for authentication. Before launch, this
          policy must be completed to explain the production data setup,
          retention periods, security practices, service providers, and any
          disclosures that apply.
        </p>
      </section>
      <section>
        <h2>Your choices and requests</h2>
        <p>
          Privacy request and account-deletion procedures have not been
          configured yet. See{" "}
          <Link
            className="font-medium text-blue-700 underline hover:text-blue-900"
            href="/privacy-choices"
          >
            Privacy Choices
          </Link>{" "}
          for the current status.
        </p>
      </section>
      <section>
        <h2>Complete this policy before launch</h2>
        <p>
          The service owner should confirm what information is collected,
          how long it is kept, where it is processed, applicable user rights,
          age requirements, and a working privacy contact before publishing a
          final policy.
        </p>
      </section>
    </InfoPage>
  );
}
