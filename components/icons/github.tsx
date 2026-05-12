import type { SVGProps } from "react";

/**
 * Inline GitHub mark. lucide-react 1.x removed brand icons for licensing
 * reasons, so we ship the mark ourselves. Uses currentColor + accepts
 * arbitrary SVG props for styling (size via className).
 */
export function GithubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.96 3.22 9.16 7.69 10.64.56.1.77-.24.77-.54 0-.27-.01-.97-.02-1.9-3.13.68-3.79-1.51-3.79-1.51-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.68.08-.68 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.94.1-.73.39-1.22.71-1.5-2.5-.28-5.13-1.25-5.13-5.56 0-1.23.44-2.23 1.16-3.02-.12-.29-.5-1.43.1-2.98 0 0 .95-.3 3.1 1.15.9-.25 1.86-.38 2.82-.39.96.01 1.92.14 2.82.39 2.14-1.45 3.09-1.15 3.09-1.15.61 1.55.23 2.69.11 2.98.72.79 1.16 1.79 1.16 3.02 0 4.32-2.64 5.28-5.15 5.55.4.35.76 1.03.76 2.08 0 1.5-.02 2.7-.02 3.07 0 .3.21.65.78.54 4.46-1.49 7.68-5.69 7.68-10.64C23.25 5.48 18.27.5 12 .5Z"
      />
    </svg>
  );
}

export default GithubIcon;
