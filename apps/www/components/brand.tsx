import { s } from '@/lib/style';

/**
 * Brand mark — the ibirdui bird on the rounded lime tile (matches the favicon).
 * Single source of truth: every header and footer across the site renders this,
 * so the logo can never drift between routes.
 */
export function BirdMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 260 257" role="img" aria-hidden="true">
      <g transform="translate(-177,-372.078727)">
        <g transform="translate(1,0.078727)">
          <g transform="matrix(1.069959,0,0,1.053183,-22.012346,-26.024589)">
            <path
              d="M429,421.92L429,578.08C429,602.32 409.629,622 385.769,622L229.231,622C205.371,622 186,602.32 186,578.08L186,421.92C186,397.68 205.371,378 229.231,378L385.769,378C409.629,378 429,397.68 429,421.92Z"
              fill="#A6FF00"
            />
          </g>
          <g transform="translate(-2.5,1.988372)">
            <path
              d="M217,544L294,467C294,467 286.151,429.759 318,411C349.849,392.241 374,418 374,418L406,427L380,450C380,450 397.792,510.182 368,545C338.208,579.818 288,568 288,568L213,593L253,550C253,550 330.785,552.821 351,527C371.632,500.646 356.553,480.022 356,480C356,480 349.142,471.608 337,471C337,471 364.335,483.422 351,512C337.665,540.578 282,542 282,542L217,544Z"
              fill="#fff"
            />
            <g transform="matrix(1.052632,0,0,1.052632,-22.052632,-24.421053)">
              <circle cx="352.5" cy="435.5" r="9.5" fill="#A6FF00" />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}

/** ↗ glyph marking a link that opens in a new tab. */
export function ExternalArrow() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={s('opacity:.75;margin-top:-1px')}
    >
      <path d="M7 17L17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}
