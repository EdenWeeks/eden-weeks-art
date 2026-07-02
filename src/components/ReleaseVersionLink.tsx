/**
 * The deployed site version as a link to its GitHub release tag. Single place
 * for the release URL and markup — every footer renders this.
 */
const RELEASE_TAG_URL = `https://github.com/EdenWeeks/eden-weeks-art/releases/tag/v${__APP_VERSION__}`;

export function ReleaseVersionLink({ className }: { className?: string }) {
  return (
    <a
      href={RELEASE_TAG_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? 'hover:text-violet-900 transition-colors underline'}
      title="Deployed site version (release tag)"
    >
      v{__APP_VERSION__}
    </a>
  );
}
