import Link from "next/link";
import InfoPage from "../components/info-page";

export default function PrivacyChoicesPage() {
  return (
    <InfoPage
      title="Privacy Choices"
      description="See which privacy controls are currently available."
    >
      <section>
        <h2>No privacy controls are available yet</h2>
        <p>
          Hypercell Social does not currently provide privacy-choice toggles or
          an account-data request form. This page is informational; it does not
          submit a request or change your settings.
        </p>
      </section>
      <section>
        <h2>Before public launch</h2>
        <p>
          The service owner should decide which privacy controls and data
          requests to support, implement a way to submit them, and update the{" "}
          <Link
            className="font-medium text-blue-700 underline hover:text-blue-900"
            href="/privacy"
          >
            Privacy Policy
          </Link>{" "}
          with accurate instructions.
        </p>
      </section>
    </InfoPage>
  );
}
