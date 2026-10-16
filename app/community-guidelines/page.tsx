import InfoPage from "../components/info-page";

export default function CommunityGuidelinesPage() {
  return (
    <InfoPage
      title="Community Guidelines"
      description="A starting point for building a welcoming, useful, and safe community."
      draft
    >
      <section>
        <h2>Be respectful</h2>
        <p>
          Treat other people with respect. Harassment, hateful conduct, threats,
          and targeted abuse have no place in the community.
        </p>
      </section>
      <section>
        <h2>Share responsibly</h2>
        <p>
          Don’t post spam, scams, impersonation, or content that violates
          someone else’s privacy or rights. Share information in good faith and
          make clear when something is your opinion.
        </p>
      </section>
      <section>
        <h2>Help keep the community healthy</h2>
        <p>
          These guidelines are starter rules, not a complete moderation policy.
          Reporting, moderation, appeals, and enforcement processes still need
          to be designed and documented before public launch.
        </p>
      </section>
    </InfoPage>
  );
}
