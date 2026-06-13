import { useColorScheme } from 'react-native';
import { Brain, Zap, Target, Activity, MessageSquare, Box } from 'lucide-react-native';

// ─────────────────────────────────────────────────────────────
// Cognify Design System — Theme Tokens
// Headspace Design Language (DesignHTML.html reference applied)
// Font: Plus Jakarta Sans (Headspace uses DM Sans — kept PJS per project preference)
// ─────────────────────────────────────────────────────────────

export const LightColors = {
  // ── Brand ──────────────────────────────────────────────────
  brandPrimary:   '#F4A041', // Headspace amber-orange (was #FF7A00)
  brandDark:      '#D4832A', // Darker pressed state
  brandLight:     '#FAC46E', // Headspace orange light (was #FFF3E6)
  coral:          '#F07060', // Headspace coral/illustration accent
  coralLight:     '#FDEAE7',

  // ── Scenic / Ambient Backgrounds (Headspace style) ─────────
  scenicYellow:   '#FFC500', // Bright warm yellow
  scenicOrange:   '#FF8E3C', // Friendly soft orange
  scenicPeach:    '#FFB7B2', // Calm pastel peach/pink
  scenicCoral:    '#FF5E36', // Vibrant coral sun accent
  scenicGreen:    '#2D6A4F', // Forest green grounding waves
  scenicBlue:     '#3A6EEA', // Calming blue
  scenicLightBlue:'#87CEEB', // Soothing sky blue
  scenicPink:     '#FFD3E8', // Light background pink panel
  scenicLinen:    '#FAF5F0', // Cream linen neutral

  // ── Headspace extended palette ──────────────────────────────
  navy:           '#1D2340', // Headspace Navy — primary text colour
  navyMid:        '#2D3561', // Mid navy — dark surface / card
  bluePrimary:    '#3A6EEA', // Headspace blue — info, active states
  blueSecondary:  '#5B8CF7', // Lighter interactive blue
  yellow:         '#F5D000', // Headspace yellow — callouts, nav active

  // ── Domain colours — Cognify brand identity (unchanged) ─────
  domain: {
    memory:    { main: '#0073E6', light: '#E6F0FF' }, // Deep Blue
    speed:     { main: '#FFC000', light: '#FFF9E6' }, // Sunshine Yellow
    attention: { main: '#3DAB7F', light: '#E6F5EE' }, // Green
    executive: { main: '#A662C6', light: '#F4EBF7' }, // Purple
    verbal:    { main: '#FF7A00', light: '#FFF0E6' }, // Orange
    spatial:   { main: '#FF7DB4', light: '#FFEBF3' }, // Pink
  },

  // ── Status / Semantic ───────────────────────────────────────
  positive:   '#3DC27A', // Headspace success green (was #3DAB7F)
  positiveBg: '#E8F8EF',
  warning:    '#F4A041', // Amber warning (aligns with brand)
  warningBg:  '#FEF3E4',
  error:      '#E04040', // Headspace error red
  errorBg:    '#FCEAEA',

  // ── Surfaces ────────────────────────────────────────────────
  appBg:      '#F0EEE8', // Headspace warm linen (was #F9F4F2)
  surface:    '#FFFFFF', // White card surface
  surfaceAlt: '#F5F5F5', // Headspace light neutral (was #F5EBE6)

  // ── Text ────────────────────────────────────────────────────
  textPrimary:   '#1D2340', // Headspace navy (was #141313 warm black)
  textSecondary: '#4A5568', // Headspace mid-grey (was #44423F)
  textMuted:     '#5F7085', // Headspace muted (was #A8A5AD)
  textInverse:   '#FFFFFF',

  // ── Borders ─────────────────────────────────────────────────
  border:       '#E8E8E8', // Headspace light border (was #E2DED9)
  borderFocus:  '#3A6EEA', // Headspace blue focus ring (was #FF7A00)

  // ── Overlay ─────────────────────────────────────────────────
  overlay:      'rgba(29, 35, 64, 0.6)',  // Navy-tinted overlay
  overlayLight: 'rgba(29, 35, 64, 0.05)',
};

export const DarkColors = {
  // ── Brand ──────────────────────────────────────────────────
  brandPrimary:   '#F4A041',
  brandDark:      '#D4832A',
  brandLight:     '#3D2810',
  coral:          '#F07060',
  coralLight:     '#2A1410',

  // ── Scenic / Ambient Backgrounds (Headspace style - Dark Mode) ─
  scenicYellow:   '#FFC500',
  scenicOrange:   '#FF8E3C',
  scenicPeach:    '#FFB7B2',
  scenicCoral:    '#FF5E36',
  scenicGreen:    '#1B4332', // Deeper forest green
  scenicBlue:     '#2D3561', // Dark navy-tinted blue
  scenicLightBlue:'#5B8CF7', // Muted glowing blue
  scenicPink:     '#331623', // Dark pink
  scenicLinen:    '#252C4A', // Dark cream neutral

  // ── Headspace extended palette ──────────────────────────────
  navy:           '#1D2340',
  navyMid:        '#2D3561',
  bluePrimary:    '#5B8CF7',
  blueSecondary:  '#3A6EEA',
  yellow:         '#F5D000',

  // ── Domain colours — brighter mains for dark contrast ──────
  domain: {
    memory:    { main: '#4D9EFF', light: '#001D33' },
    speed:     { main: '#FFD147', light: '#332600' },
    attention: { main: '#5CD6A3', light: '#0F3323' },
    executive: { main: '#C48BE0', light: '#2A1733' },
    verbal:    { main: '#FF9940', light: '#331800' },
    spatial:   { main: '#FF9EC9', light: '#331623' },
  },

  // ── Status / Semantic ───────────────────────────────────────
  positive:   '#3DC27A',
  positiveBg: '#0A2E1A',
  warning:    '#F4A041',
  warningBg:  '#2E1C08',
  error:      '#E04040',
  errorBg:    '#2E0A0A',

  // ── Surfaces ────────────────────────────────────────────────
  appBg:      '#1A1F3A', // Headspace dark navy (was #141313 warm black)
  surface:    '#252C4A', // Headspace dark card (was #222120)
  surfaceAlt: '#2D3561', // Headspace navy mid (was #2D2C2B)

  // ── Text ────────────────────────────────────────────────────
  textPrimary:   '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.70)', // Headspace dark mode (was #D0CDD3)
  textMuted:     '#A0B0C0',               // Headspace muted (was #8F8D91)
  textInverse:   '#FFFFFF',

  // ── Borders ─────────────────────────────────────────────────
  border:       '#3A4060', // Headspace dark border (was #3F3D3A)
  borderFocus:  '#5B8CF7',

  // ── Overlay ─────────────────────────────────────────────────
  overlay:      'rgba(0, 0, 0, 0.80)',
  overlayLight: 'rgba(255, 255, 255, 0.06)',
};

// Fallback for static imports while refactoring
export const Colors = LightColors;

export function useThemeColors() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DarkColors : LightColors;
}

export function getContrastSafeDomainColor(domainId, Colors) {
  const isDark = Colors.appBg === '#1A1F3A';
  if (isDark) {
    return Colors.domain[domainId]?.main || '#FFFFFF';
  }
  switch (domainId) {
    case 'memory':    return '#0059B3';
    case 'speed':     return '#B37D00';
    case 'attention': return '#1E6B4A';
    case 'executive': return '#723494';
    case 'verbal':    return '#CC5200';
    case 'spatial':   return '#C43B72';
    default:          return Colors.textSecondary;
  }
}

export const Typography = {
  // Font family — Plus Jakarta Sans (same geometric warmth as DM Sans)
  fontFamily: {
    regular:    'PlusJakartaSans_400Regular',
    medium:     'PlusJakartaSans_500Medium',
    semiBold:   'PlusJakartaSans_600SemiBold',
    bold:       'PlusJakartaSans_700Bold',
    extraBold:  'PlusJakartaSans_800ExtraBold',
    mono:       'System',
  },

  // Type scale — aligned to Headspace spec from DesignHTML.html
  size: {
    display: 40,  // Hero headings (was 48 — Headspace: 40px bold -1px tracking)
    h1:      28,  // Screen titles (was 32 — Headspace: 28px bold -0.5px tracking)
    h2:      22,  // Component headings (was 28 — Headspace: 22px bold)
    h3:      17,  // Card titles (was 20 — Headspace: 17px bold)
    body:    15,  // Body primary (was 16 — Headspace: 15px)
    label:   15,  // Labels, chips (unchanged)
    caption: 13,  // Meta / small body (unchanged ✓)
    micro:   11,  // Tiny labels e.g. "pts" (unchanged ✓)
  },

  // Letter spacing — Headspace applies negative tracking at large sizes
  letterSpacing: {
    display: -1.0,
    h1:      -0.5,
    h2:       0,
    tight:   -0.3,
    normal:   0,
    wide:     0.5,  // Used for uppercase caption labels
    wider:    1.0,  // Used for overline / card-title uppercase
  },

  // Line heights
  lineHeight: {
    tight:   1.1,
    snug:    1.2,
    normal:  1.5,
    relaxed: 1.6,
  },
};

export const Spacing = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
  12: 48,
  16: 64,
};

// Border Radius — aligned to Headspace spec from DesignHTML.html
export const Radius = {
  xs:        6,   // Tags, small badges (Headspace: 6px)
  thumbnail: 10,  // Image thumbnails, list icons (Headspace: 10px)
  sm:        14,  // List items, smaller cards (Headspace: 14px)
  md:        16,  // Input fields, medium cards (Headspace: 16px ✓)
  card:      20,  // Standard cards (Headspace: 20px, was 24)
  lg:        24,  // Large cards, bottom sheets (Headspace: 24px)
  xl:        32,  // Hero cards, modals
  full:      999, // Pills, avatars, toggles
};

// Shadows — aligned exactly to Headspace spec
export const Shadow = {
  sm: {
    // Subtle — cards (Headspace: 0 1px 4px rgba(0,0,0,0.06))
    shadowColor: '#1D2340',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    // Medium — overlays, popovers (Headspace: 0 2px 12px rgba(0,0,0,0.10))
    shadowColor: '#1D2340',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    // Strong — modals, bottom sheets (Headspace: 0 4px 24px rgba(0,0,0,0.15))
    shadowColor: '#1D2340',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const Motion = {
  instant:    100,
  fast:       200,
  standard:   300,
  deliberate: 500,
  reveal:     800,
  breath:     1500,
};

// Domain metadata — unchanged
export const getDomains = (colors) => [
  { id: 'memory',    label: 'memory',    fullLabel: 'Working Memory',      color: colors.domain.memory,    icon: Brain },
  { id: 'speed',     label: 'speed',     fullLabel: 'Processing Speed',    color: colors.domain.speed,     icon: Zap },
  { id: 'attention', label: 'attention', fullLabel: 'Sustained Attention', color: colors.domain.attention, icon: Target },
  { id: 'executive', label: 'thinking',  fullLabel: 'Executive Function',  color: colors.domain.executive, icon: Activity },
  { id: 'verbal',    label: 'language',  fullLabel: 'Verbal Reasoning',    color: colors.domain.verbal,    icon: MessageSquare },
  { id: 'spatial',   label: 'spatial',   fullLabel: 'Spatial Cognition',   color: colors.domain.spatial,   icon: Box },
];

// Fallback static export
export const DOMAINS = getDomains(LightColors);
