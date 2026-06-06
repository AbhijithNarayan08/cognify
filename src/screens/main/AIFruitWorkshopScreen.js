import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Ellipse, Defs, RadialGradient, Stop, G } from 'react-native-svg';
import {
  ArrowLeft,
  RotateCcw,
  Sparkle,
  Info,
  HelpCircle,
  Award,
} from 'lucide-react-native';
import { useThemeColors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { GameHaptics } from '../../utils/haptics';

// ── Screen Constants ────────────────────────────────────────────────────────
const SCREEN_WIDTH = Dimensions.get('window').width;

const FRUIT_TIERS = [
  { tier: 1, name: 'cherry', radius: 15, visualScale: 0.66, label: 'cherry', color: '#FF7DB4', lightColor: '#FFEBF3' }, // Spatial Pink
  { tier: 2, name: 'strawberry', radius: 21, visualScale: 0.66, label: 'strawberry', color: '#FF5E5B', lightColor: '#FFF0F0' }, // Mascot Coral Red
  { tier: 3, name: 'grape', radius: 27, visualScale: 0.72, label: 'grape', color: '#A662C6', lightColor: '#F4EBF7' }, // Executive Purple
  { tier: 4, name: 'clementine', radius: 34, visualScale: 0.70, label: 'clementine', color: '#FFC000', lightColor: '#FFF9E6' }, // Mascot Gold & Cream
  { tier: 5, name: 'peach', radius: 42, visualScale: 0.72, label: 'peach', color: '#F4A041', lightColor: '#FFF0E6' }, // Brand Primary Orange
  { tier: 6, name: 'melon', radius: 50, visualScale: 0.74, label: 'melon', color: '#3DAB7F', lightColor: '#E6F5EE' }, // Attention Green
  { tier: 7, name: 'peach melon', radius: 59, visualScale: 0.72, label: 'peach melon', color: '#FFC0CB', lightColor: '#FFEBF3' }, // Peach Melon mascot pink
  { tier: 8, name: 'watermelon', radius: 68, visualScale: 0.76, label: 'watermelon', color: '#2E8B57', lightColor: '#FF5E5B' }, // Green Skin & Coral core
];

// Helper sizes for physics
const getFruitRadius = (tier) => {
  return FRUIT_TIERS[tier - 1]?.radius || 15;
};

const getFruitPhysicsRadius = (tier) => {
  const t = FRUIT_TIERS[tier - 1];
  if (!t) return 15 * 0.72;
  return t.radius * (t.visualScale || 0.72);
};

const getFruitName = (tier) => {
  return FRUIT_TIERS[tier - 1]?.name || 'fruit';
};

// ── Reworked Mascot SVG Renderer ─────────────────────────────────────────────
function FruitSvg({ tier, r = 30 }) {
  const metadata = FRUIT_TIERS[tier - 1] || FRUIT_TIERS[0];

  const getLayers = () => {
    switch (tier) {
      case 1:
        return { outer: '#FF7DB4', middle: '#FF7DB4', inner: '#FF7DB4' };
      case 2:
        return { outer: '#FF5E5B', middle: '#FF5E5B', inner: '#FF5E5B' };
      case 3:
        return { outer: '#A662C6', middle: '#A662C6', inner: '#A662C6' };
      case 4:
        return { outer: '#FFC000', middle: '#FFC000', inner: '#FFC000' };
      case 5:
        return { outer: '#FF7A00', middle: '#FF7A00', inner: '#FF7A00' };
      case 6:
        return { outer: '#3DAB7F', middle: '#3DAB7F', inner: '#3DAB7F' };
      case 7:
        return { outer: '#FAD4C0', middle: '#FFC0CB', inner: '#FFC0CB' };
      case 8:
        return { outer: '#2E8B57', middle: '#2E8B57', inner: '#2E8B57' };
      default:
        return { outer: '#FF5E5B', middle: '#FF5E5B', inner: '#FF5E5B' };
    }
  };

  const { outer, middle, inner } = getLayers();

  const renderFruitShape = () => {
    switch (tier) {
      case 1: // Cherry
        return (
          <G>
            {/* Double Stem */}
            <Path d="M50,22 Q60,7 66,13" stroke="#1A1816" strokeWidth="3" fill="none" strokeLinecap="round" />
            <Path d="M48,22 Q38,8 30,15" stroke="#1A1816" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Outer body */}
            <Circle cx="50" cy="56" r="33" fill={outer} stroke="#1A1816" strokeWidth="2.2" />
            {/* Middle body */}
            <Circle cx="50" cy="56" r="24" fill={middle} />
            {/* Inner core */}
            <Circle cx="50" cy="56" r="16" fill={inner} />
          </G>
        );
      case 2: // Strawberry
        return (
          <G>
            {/* Leaf Crown */}
            <Path d="M30,30 Q50,42 70,30 Q80,18 62,18 Q50,26 38,18 Q20,18 30,30" fill="#3DAB7F" stroke="#1A1816" strokeWidth="2.2" />
            {/* Outer body */}
            <Path d="M50,91 C23,76 13,54 18,36 C23,18 77,18 82,36 C87,54 77,76 50,91 Z" fill={outer} stroke="#1A1816" strokeWidth="2.2" />
            {/* Middle body */}
            <Path d="M50,83 C28,70 20,52 24,38 C28,24 72,24 76,38 C80,52 72,70 50,83 Z" fill={middle} />
            {/* Inner core */}
            <Path d="M50,73 C34,62 28,48 31,39 C34,30 66,30 69,39 C72,48 66,62 50,73 Z" fill={inner} />
          </G>
        );
      case 3: // Grape
        return (
          <G>
            {/* Stem */}
            <Path d="M50,15 Q55,2 62,6" stroke="#1A1816" strokeWidth="3" fill="none" strokeLinecap="round" />
            <Path d="M50,15 L50,28" stroke="#1A1816" strokeWidth="3" fill="none" />
            {/* Outer body */}
            <Ellipse cx="50" cy="56" rx="34" ry="38" fill={outer} stroke="#1A1816" strokeWidth="2.2" />
            {/* Middle body */}
            <Ellipse cx="50" cy="56" rx="26" ry="30" fill={middle} />
            {/* Inner core */}
            <Ellipse cx="50" cy="56" rx="18" ry="22" fill={inner} />
          </G>
        );
      case 4: // Clementine
        return (
          <G>
            {/* Leaf */}
            <Path d="M50,18 Q65,8 56,26" fill="#3DAB7F" stroke="#1A1816" strokeWidth="2" />
            {/* Stem */}
            <Path d="M50,18 L50,26" stroke="#1A1816" strokeWidth="2.5" fill="none" />
            {/* Outer body */}
            <Circle cx="50" cy="56" r="35" fill={outer} stroke="#1A1816" strokeWidth="2.2" />
            {/* Middle body */}
            <Circle cx="50" cy="56" r="26" fill={middle} />
            {/* Inner core */}
            <Circle cx="50" cy="56" r="17" fill={inner} />
          </G>
        );
      case 5: // Peach
        return (
          <G>
            {/* Stem & Leaf */}
            <Path d="M50,12 Q40,4 32,8 C32,8 42,16 48,15" fill="#3DAB7F" stroke="#1A1816" strokeWidth="2" />
            {/* Outer Peach body */}
            <Path d="M50,91 C16,76 12,38 42,24 C47,22 50,24 50,24 C50,24 53,22 58,24 C88,38 84,76 50,91 Z" fill={outer} stroke="#1A1816" strokeWidth="2.2" />
            {/* Middle Peach body */}
            <Path d="M50,81 C22,68 18,36 43,26 C47,25 50,26 50,26 C50,26 53,25 57,26 C82,36 78,68 50,81 Z" fill={middle} />
            {/* Inner Peach body */}
            <Path d="M50,71 C28,60 25,36 44,28 C47,27 50,28 50,28 C50,28 53,27 56,28 C75,36 72,60 50,71 Z" fill={inner} />
            {/* cleft cleft line */}
            <Path d="M50,24 Q48,55 50,91" stroke="#1A1816" strokeWidth="1.5" strokeDasharray="3,3" fill="none" />
          </G>
        );
      case 6: // Melon
        return (
          <G>
            {/* Outer Melon Body */}
            <Circle cx="50" cy="53" r="37" fill={outer} stroke="#1A1816" strokeWidth="2.2" />
            {/* Mesh Netting details on outer skin */}
            <Path d="M25,35 Q50,45 75,35" stroke="#FFFFFF" strokeWidth="1.5" fill="none" opacity={0.65} />
            <Path d="M20,53 Q50,61 80,53" stroke="#FFFFFF" strokeWidth="1.5" fill="none" opacity={0.65} />
            <Path d="M25,70 Q50,80 75,70" stroke="#FFFFFF" strokeWidth="1.5" fill="none" opacity={0.65} />
            {/* Middle body */}
            <Circle cx="50" cy="53" r="28" fill={middle} />
            {/* Inner body */}
            <Circle cx="50" cy="53" r="19" fill={inner} />
          </G>
        );
      case 7: // Peach Melon (Pink peach/melon from home screen)
        return (
          <G>
            {/* Leaf */}
            <Path d="M48,18 C48,18 53,5 65,10 C65,10 60,23 48,18" fill="#A8D5BA" stroke="#1A1816" strokeWidth="2" strokeLinejoin="round" />
            {/* Stem */}
            <Path d="M48,18 Q45,23 42,28" stroke="#8B5E3C" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Base Body */}
            <Circle cx="50" cy="53" r="36" fill={outer} stroke="#1A1816" strokeWidth="2.2" />
            {/* Pink Shading Circle */}
            <Circle cx="44" cy="53" r="36" fill={middle} opacity={0.65} />
            {/* Protruding side arc outline */}
            <Path d="M44,17 A36,36 0 0,0 23,83" stroke="#1A1816" strokeWidth="2.2" fill="none" />
          </G>
        );
      case 8: // Watermelon
        return (
          <G>
            {/* Outer Watermelon Skin */}
            <Circle cx="50" cy="53" r="38" fill={outer} stroke="#1A1816" strokeWidth="2.5" />
            {/* Dark green stripes */}
            <Path d="M50,15 Q40,53 50,91" stroke="#1D2340" strokeWidth="5.5" fill="none" opacity={0.4} />
            <Path d="M30,19 Q15,53 30,87" stroke="#1D2340" strokeWidth="4.5" fill="none" opacity={0.4} />
            <Path d="M70,19 Q85,53 70,87" stroke="#1D2340" strokeWidth="4.5" fill="none" opacity={0.4} />
            {/* Middle skin layer */}
            <Circle cx="50" cy="53" r="30" fill={middle} />
            {/* Inner Core (Red fleshy core!) */}
            <Circle cx="50" cy="53" r="22" fill={inner} stroke="#1A1816" strokeWidth="1.8" />
          </G>
        );
      default:
        return <Circle cx="50" cy="53" r="35" fill={outer} stroke="#1A1816" strokeWidth="2.2" />;
    }
  };

  const renderFace = () => {
    const blushColor = '#FF5E5B'; // Coral Red blush matching the mascot!
    let eyes = null;
    let mouth = null;

    // Use curved stroke-based eyes and gasping mouths matching the mascot style
    switch (tier) {
      case 1: // Cherry
        eyes = (
          <G>
            <Path d="M 38 52 Q 42 55 46 52" stroke="#1A1816" strokeWidth="2.8" strokeLinecap="round" fill="none" />
            <Path d="M 54 52 Q 58 55 62 52" stroke="#1A1816" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          </G>
        );
        mouth = <Path d="M 47 57 Q 50 60 53 57" stroke="#1A1816" strokeWidth="2.2" strokeLinecap="round" fill="none" />;
        break;
      case 2: // Strawberry (Winking)
        eyes = (
          <G>
            <Path d="M 38 48 Q 42 44 46 48" stroke="#1A1816" strokeWidth="2.8" strokeLinecap="round" fill="none" />
            <Circle cx="62" cy="46" r="3.5" fill="#1A1816" />
          </G>
        );
        mouth = <Path d="M 46 54 Q 50 60 54 54" stroke="#1A1816" strokeWidth="2.5" fill="#FF5E5B" strokeLinecap="round" />;
        break;
      case 3: // Grape (Sleepy)
        eyes = (
          <G>
            <Path d="M 32 50 Q 37 53 42 50" stroke="#1A1816" strokeWidth="2.8" strokeLinecap="round" fill="none" />
            <Path d="M 58 50 Q 63 53 68 50" stroke="#1A1816" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          </G>
        );
        mouth = <Path d="M 48 57 Q 50 59 52 57" stroke="#1A1816" strokeWidth="2" strokeLinecap="round" fill="none" />;
        break;
      case 4: // Clementine (Surprised gasp)
        eyes = (
          <G>
            <Path d="M 33 49 Q 37 52 41 49" stroke="#1A1816" strokeWidth="2.8" strokeLinecap="round" fill="none" />
            <Path d="M 59 49 Q 63 52 67 49" stroke="#1A1816" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          </G>
        );
        mouth = <Circle cx="50" cy="56" r="3.5" fill="#1A1816" />;
        break;
      case 5: // Peach (Blushing cute)
        eyes = (
          <G>
            <Circle cx="35" cy="48" r="4.5" fill="#1A1816" />
            <Circle cx="33" cy="46" r="1.5" fill="#FFFFFF" />
            <Circle cx="65" cy="48" r="4.5" fill="#1A1816" />
            <Circle cx="63" cy="46" r="1.5" fill="#FFFFFF" />
          </G>
        );
        mouth = <Path d="M44,54 Q47,57 50,54 Q53,57 56,54" stroke="#1A1816" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
        break;
      case 6: // Melon (Winking gasp)
        eyes = (
          <G>
            <Path d="M 33 46 Q 38 42 43 46" stroke="#1A1816" strokeWidth="2.8" strokeLinecap="round" fill="none" />
            <Circle cx="65" cy="46" r="4" fill="#1A1816" />
          </G>
        );
        mouth = <Circle cx="50" cy="54" r="3" fill="#1A1816" />;
        break;
      case 7: // Peach Melon
        eyes = (
          <G>
            <Circle cx="40" cy="52" r="3.5" fill="#1A1816" />
            <Circle cx="60" cy="52" r="3.5" fill="#1A1816" />
          </G>
        );
        mouth = <Path d="M48,59 Q50,62 52,59" stroke="#1A1816" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
        break;
      case 8: // Watermelon (Surprised giant)
        eyes = (
          <G>
            <Circle cx="34" cy="47" r="5" fill="none" stroke="#1D2340" strokeWidth="2.5" />
            <Circle cx="34" cy="47" r="1.5" fill="#1D2340" />
            <Circle cx="66" cy="47" r="5" fill="none" stroke="#1D2340" strokeWidth="2.5" />
            <Circle cx="66" cy="47" r="1.5" fill="#1D2340" />
          </G>
        );
        mouth = <Circle cx="50" cy="57" r="4.5" fill="#1D2340" />;
        break;
      default:
        eyes = (
          <G>
            <Circle cx="35" cy="51" r="3.5" fill="#1A1816" />
            <Circle cx="65" cy="51" r="3.5" fill="#1A1816" />
          </G>
        );
        mouth = <Path d="M46,58 Q50,61 54,58" stroke="#1A1816" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
    }

    // Positions adapted for inner core coordinates (y values adjusted slightly higher)
    const cheekY = tier === 2 ? 54 : (tier === 3 ? 56 : (tier === 4 ? 55 : (tier === 5 ? 54 : (tier === 8 ? 54 : 52))));

    return (
      <G>
        {/* Blush Cheeks - squashed Ellipses like flame core */}
        <Ellipse cx="27" cy={cheekY} rx={4} ry={2} fill={blushColor} opacity={0.7} />
        <Ellipse cx="73" cy={cheekY} rx={4} ry={2} fill={blushColor} opacity={0.7} />

        {/* Eyes & Mouth */}
        {eyes}
        {mouth}

        {/* Glowing sparkles on ultimate Watermelon tier */}
        {tier === 8 && (
          <G>
            <Path d="M12,25 L16,29 L12,33 L8,29 Z" fill="#FFFFFF" />
            <Path d="M88,25 L92,29 L88,33 L84,29 Z" fill="#FFFFFF" />
            <Circle cx="12" cy="29" r="1.5" fill="#FFC000" />
            <Circle cx="88" cy="29" r="1.5" fill="#FFC000" />
          </G>
        )}
      </G>
    );
  };

  return (
    <View style={{ width: r * 2, height: r * 2, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={r * 2} height={r * 2} viewBox="0 0 100 100">
        {renderFruitShape()}
        {renderFace()}
      </Svg>
    </View>
  );
}

// ── Main Screen Component ───────────────────────────────────────────────────
export default function AIFruitWorkshopScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const Colors = useThemeColors();

  // ── Physics Sandbox State ────────────────────────────────────────────────
  const [fruits, setFruits] = useState([]);
  const [particles, setParticles] = useState([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [previewFruitTier, setPreviewFruitTier] = useState(1);
  const [previewX, setPreviewX] = useState(175); // middle of 350 width
  const [gameOver, setGameOver] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);

  // Ref boundaries and physics loop sync
  const boxWidth = 350;
  const boxHeight = 500;
  const isReadyToDrop = useRef(true);
  const gameOverTimer = useRef(0);
  const fruitsRef = useRef([]); // Synchronous ref to prevent React batching/stale updates

  // ── Helper to create a new rigid-body fruit ─────────────────────────────
  const createFruit = (tier, x, y, vx = 0, vy = 0) => {
    const r = getFruitRadius(tier);
    const r_phys = getFruitPhysicsRadius(tier);
    const mass = r_phys * r_phys;
    const inertia = 0.5 * mass * r_phys * r_phys;
    return {
      id: Math.random().toString(36).substring(2, 9),
      tier,
      x,
      y,
      vx,
      vy,
      angle: 0,
      angVel: 0,
      r,
      r_phys,
      mass,
      invMass: 1 / mass,
      inertia,
      invInertia: 1 / inertia,
      asleep: false,
      sleepTimer: 0,
      consumed: false,
    };
  };

  // ── Custom 2D rigid-body contact physics step ──────────────────────────────
  const runFramePhysics = (activeFruits, dt) => {
    const k = 4; // Substeps
    const h = dt / k; // Time per substep
    const iters = 8; // Contact solver iterations

    // Physical constants alignment with Reference Spec & User Feedback
    const gravity = 900; // px/s^2 points DOWN (slower, cozy feel)
    const restitution = 0.35; // e = 0.35 (cozy bouncy feel)
    const friction = 0.4; // mu = 0.4 Coulomb sliding friction
    const d_lin = 0.02; // linear damping
    const d_ang = 0.05; // angular damping
    const slop = 0.02; // penetration slop (px)
    const beta = 0.2; // Baumgarte positional correction factor

    let currentFruits = activeFruits.map(f => ({ ...f }));

    // Execute substeps
    for (let substep = 0; substep < k; substep++) {
      // 1. Integrate velocity (semi-implicit Euler)
      for (let i = 0; i < currentFruits.length; i++) {
        let f = currentFruits[i];
        if (!f.asleep) {
          f.vy += gravity * h;
          f.vx *= (1 - d_lin * h);
          f.vy *= (1 - d_lin * h);
          f.angVel *= (1 - d_ang * h);
        }
      }

      // 2. Broad/Narrow Phase: Generate contacts
      let contacts = [];

      // Circle-Circle collisions
      for (let i = 0; i < currentFruits.length; i++) {
        for (let j = i + 1; j < currentFruits.length; j++) {
          let f1 = currentFruits[i];
          let f2 = currentFruits[j];

          let dx = f2.x - f1.x;
          let dy = f2.y - f1.y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          let minDist = f1.r_phys + f2.r_phys;

          if (dist < minDist) {
            // Wake up bodies if one of them is moving
            if (f1.asleep && !f2.asleep) {
              f1.asleep = false;
              f1.sleepTimer = 0;
            }
            if (!f1.asleep && f2.asleep) {
              f2.asleep = false;
              f2.sleepTimer = 0;
            }

            // If both remain asleep, skip responses
            if (f1.asleep && f2.asleep) continue;

            let nx, ny;
            if (dist === 0) {
              // Exact center overlap safeguard: push straight up/apart
              nx = 0;
              ny = -1;
              dist = 0.01;
            } else {
              nx = dx / dist;
              ny = dy / dist;
            }
            let pen = minDist - dist;

            // Contact point along center line (using physics radius)
            let px = f1.x + nx * f1.r_phys;
            let py = f1.y + ny * f1.r_phys;

            let rx1 = px - f1.x;
            let ry1 = py - f1.y;
            let rx2 = px - f2.x;
            let ry2 = py - f2.y;

            contacts.push({
              body1: f1,
              body2: f2,
              nx, ny,
              pen,
              rx1, ry1,
              rx2, ry2,
              accumulatedNormalImpulse: 0,
              accumulatedTangentImpulse: 0,
            });
          }
        }
      }

      // Circle-Wall collisions
      for (let i = 0; i < currentFruits.length; i++) {
        let f = currentFruits[i];
        if (f.asleep) continue;

        // Left wall: x = 0 (Normal points from fruit to wall, i.e., LEFT)
        if (f.x - f.r_phys < 0) {
          let pen = f.r_phys - f.x;
          let nx = -1;
          let ny = 0;
          contacts.push({
            body1: f,
            body2: null,
            nx, ny,
            pen,
            rx1: nx * f.r_phys, ry1: ny * f.r_phys,
            rx2: 0, ry2: 0,
            accumulatedNormalImpulse: 0,
            accumulatedTangentImpulse: 0,
          });
        }

        // Right wall: x = boxWidth (Normal points from fruit to wall, i.e., RIGHT)
        if (f.x + f.r_phys > boxWidth) {
          let pen = f.x + f.r_phys - boxWidth;
          let nx = 1;
          let ny = 0;
          contacts.push({
            body1: f,
            body2: null,
            nx, ny,
            pen,
            rx1: nx * f.r_phys, ry1: ny * f.r_phys,
            rx2: 0, ry2: 0,
            accumulatedNormalImpulse: 0,
            accumulatedTangentImpulse: 0,
          });
        }

        // Floor: landing on the visible floor bar at y = floorY (Normal points from fruit to floor, i.e., DOWN)
        const floorY = boxHeight - 16;
        if (f.y + f.r_phys > floorY) {
          let pen = f.y + f.r_phys - floorY;
          let nx = 0;
          let ny = 1;
          contacts.push({
            body1: f,
            body2: null,
            nx, ny,
            pen,
            rx1: nx * f.r_phys, ry1: ny * f.r_phys,
            rx2: 0, ry2: 0,
            accumulatedNormalImpulse: 0,
            accumulatedTangentImpulse: 0,
          });
        }
      }

      // Precompute Sequential Impulse contact parameters once per substep
      for (let c = 0; c < contacts.length; c++) {
        let contact = contacts[c];
        let f1 = contact.body1;
        let f2 = contact.body2;
        let nx = contact.nx;
        let ny = contact.ny;
        let rx1 = contact.rx1;
        let ry1 = contact.ry1;
        let rx2 = contact.rx2;
        let ry2 = contact.ry2;

        let invMass1 = f1.invMass;
        let invInertia1 = f1.invInertia;
        let rn1 = rx1 * ny - ry1 * nx;
        let rt1 = rx1 * nx + ry1 * ny; // 2D cross product of r1 and tangent (tx = -ny, ty = nx)

        let invMass2 = f2 ? f2.invMass : 0;
        let invInertia2 = f2 ? f2.invInertia : 0;
        let rn2 = f2 ? (rx2 * ny - ry2 * nx) : 0;
        let rt2 = f2 ? (rx2 * nx + ry2 * ny) : 0;

        let denom = invMass1 + invMass2 + (rn1 * rn1 * invInertia1) + (rn2 * rn2 * invInertia2);
        let denom_t = invMass1 + invMass2 + (rt1 * rt1 * invInertia1) + (rt2 * rt2 * invInertia2);

        // Compute initial relative velocity at contact
        let v1x = f1.vx - f1.angVel * ry1;
        let v1y = f1.vy + f1.angVel * rx1;
        let v2x = f2 ? (f2.vx - f2.angVel * ry2) : 0;
        let v2y = f2 ? (f2.vy + f2.angVel * rx2) : 0;
        let rvx = v2x - v1x;
        let rvy = v2y - v1y;
        let vrel = rvx * nx + rvy * ny;

        // Bias term for restitution (restitution applied once to prevent over-bouncing jitter)
        let bias = 0;
        const bounceThreshold = 60; // minimum closing speed to bounce (px/s)
        if (vrel < -bounceThreshold) {
          bias = -restitution * vrel;
        }

        contact.rn1 = rn1;
        contact.rt1 = rt1;
        contact.rn2 = rn2;
        contact.rt2 = rt2;
        contact.denom = denom;
        contact.denom_t = denom_t;
        contact.bias = bias;
      }

      // 3. Solve Contacts (iters iterations)
      for (let iter = 0; iter < iters; iter++) {
        for (let c = 0; c < contacts.length; c++) {
          let contact = contacts[c];
          let f1 = contact.body1;
          let f2 = contact.body2;
          let nx = contact.nx;
          let ny = contact.ny;

          let rx1 = contact.rx1;
          let ry1 = contact.ry1;
          let rx2 = f2 ? contact.rx2 : 0;
          let ry2 = f2 ? contact.ry2 : 0;

          let rn1 = contact.rn1;
          let rt1 = contact.rt1;
          let rn2 = contact.rn2;
          let rt2 = contact.rt2;
          let denom = contact.denom;
          let denom_t = contact.denom_t;

          // Re-calculate relative velocities at contact point
          let v1x = f1.vx - f1.angVel * ry1;
          let v1y = f1.vy + f1.angVel * rx1;
          let v2x = f2 ? (f2.vx - f2.angVel * ry2) : 0;
          let v2y = f2 ? (f2.vy + f2.angVel * rx2) : 0;
          let rvx = v2x - v1x;
          let rvy = v2y - v1y;

          let vrel = rvx * nx + rvy * ny;

          // Solve Normal Impulse
          let dj = -(vrel + contact.bias) / (denom || 1);

          let oldNormalImpulse = contact.accumulatedNormalImpulse;
          contact.accumulatedNormalImpulse = Math.max(0, oldNormalImpulse + dj);
          dj = contact.accumulatedNormalImpulse - oldNormalImpulse;

          // Apply Normal Impulse
          let invMass1 = f1.invMass;
          let invMass2 = f2 ? f2.invMass : 0;
          f1.vx -= dj * invMass1 * nx;
          f1.vy -= dj * invMass1 * ny;
          f1.angVel -= dj * f1.invInertia * rn1;
          if (f2) {
            f2.vx += dj * invMass2 * nx;
            f2.vy += dj * invMass2 * ny;
            f2.angVel += dj * f2.invInertia * rn2;
          }

          // Re-calculate relative velocities for friction
          v1x = f1.vx - f1.angVel * ry1;
          v1y = f1.vy + f1.angVel * rx1;
          v2x = f2 ? (f2.vx - f2.angVel * ry2) : 0;
          v2y = f2 ? (f2.vy + f2.angVel * rx2) : 0;
          rvx = v2x - v1x;
          rvy = v2y - v1y;

          let tx = -ny;
          let ty = nx;
          let vtrel = rvx * tx + rvy * ty;

          // Solve Friction/Tangent Impulse
          let djt = -vtrel / (denom_t || 1);

          let maxFriction = friction * contact.accumulatedNormalImpulse;
          let oldTangentImpulse = contact.accumulatedTangentImpulse;
          contact.accumulatedTangentImpulse = Math.max(-maxFriction, Math.min(maxFriction, oldTangentImpulse + djt));
          djt = contact.accumulatedTangentImpulse - oldTangentImpulse;

          // Apply Friction/Tangent Impulse
          f1.vx -= djt * invMass1 * tx;
          f1.vy -= djt * invMass1 * ty;
          f1.angVel -= djt * f1.invInertia * rt1;
          if (f2) {
            f2.vx += djt * invMass2 * tx;
            f2.vy += djt * invMass2 * ty;
            f2.angVel += djt * f2.invInertia * rt2;
          }
        }
      }

      // 4. Integrate position
      for (let i = 0; i < currentFruits.length; i++) {
        let f = currentFruits[i];
        if (!f.asleep) {
          f.x += f.vx * h;
          f.y += f.vy * h;
          f.angle += f.angVel * h;
        }
      }

      // 5. Positional Correction (Baumgarte)
      for (let c = 0; c < contacts.length; c++) {
        let contact = contacts[c];
        let f1 = contact.body1;
        let f2 = contact.body2;
        let nx = contact.nx;
        let ny = contact.ny;
        let pen = contact.pen;

        let invMass1 = f1.invMass;
        let invMass2 = f2 ? f2.invMass : 0;

        let corr = (Math.max(pen - slop, 0) * beta) / ((invMass1 + invMass2) || 1);

        f1.x -= corr * invMass1 * nx;
        f1.y -= corr * invMass1 * ny;

        if (f2) {
          f2.x += corr * invMass2 * nx;
          f2.y += corr * invMass2 * ny;
        }
      }
    }

    // 6. Sleep/wake update (check velocities after all substeps)
    const linVelEps = 0.15;
    const angVelEps = 0.15;
    const sleepTime = 0.5; // seconds

    for (let i = 0; i < currentFruits.length; i++) {
      let f = currentFruits[i];
      let velMag = Math.sqrt(f.vx * f.vx + f.vy * f.vy);
      let angVelMag = Math.abs(f.angVel);

      if (velMag < linVelEps && angVelMag < angVelEps) {
        f.sleepTimer += dt;
        if (f.sleepTimer >= sleepTime) {
          f.asleep = true;
          f.vx = 0;
          f.vy = 0;
          f.angVel = 0;
        }
      } else {
        f.asleep = false;
        f.sleepTimer = 0;
      }
    }

    // 7. Find same-tier merge contacts (using physical radius for exact overlap)
    let mergesToExecute = [];
    let mergedIds = new Set();

    for (let i = 0; i < currentFruits.length; i++) {
      for (let j = i + 1; j < currentFruits.length; j++) {
        let f1 = currentFruits[i];
        let f2 = currentFruits[j];

        if (mergedIds.has(f1.id) || mergedIds.has(f2.id)) continue;

        if (f1.tier === f2.tier && f1.tier < 8) {
          let dx = f2.x - f1.x;
          let dy = f2.y - f1.y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          let minDist = f1.r_phys + f2.r_phys;

          if (dist < minDist + 1.5) { // small contact margin
            f1.consumed = true;
            f2.consumed = true;
            mergesToExecute.push({
              f1,
              f2,
              mx: (f1.x + f2.x) / 2,
              my: (f1.y + f2.y) / 2,
              tier: f1.tier,
            });
            mergedIds.add(f1.id);
            mergedIds.add(f2.id);
          }
        }
      }
    }

    if (mergedIds.size > 0) {
      currentFruits = currentFruits.filter(f => !mergedIds.has(f.id));
    }

    return { newFruits: currentFruits, mergesToExecute };
  };

  const spawnParticles = (x, y, color) => {
    const pCount = 8;
    const newParticles = [];
    for (let i = 0; i < pCount; i++) {
      const angle = (i / pCount) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 1.0 + Math.random() * 1.5;
      newParticles.push({
        id: Math.random().toString(36).substring(2, 9),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3.0 + Math.random() * 2.5,
        alpha: 1,
        life: 30 + Math.floor(Math.random() * 15),
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  // Main Sandbox Loop
  useEffect(() => {
    let animFrameId;
    let lastTime = Date.now();
    let accumulator = 0;
    const dt = 1 / 60; // 16.67ms fixed physics timestep

    const loop = () => {
      const now = Date.now();
      let elapsed = (now - lastTime) / 1000;
      lastTime = now;

      // Prevent spiral of death if app suspended or lagged
      if (elapsed > 0.15) {
        elapsed = 0.15;
      }

      accumulator += elapsed;

      if (accumulator >= dt) {
        let currentFruits = fruitsRef.current.map(f => ({ ...f }));
        let allMerges = [];

        // Run fixed steps
        while (accumulator >= dt) {
          const stepResult = runFramePhysics(currentFruits, dt);
          currentFruits = stepResult.newFruits;
          if (stepResult.mergesToExecute.length > 0) {
            allMerges.push(...stepResult.mergesToExecute);
          }
          accumulator -= dt;
        }

        // Resolve merges
        if (allMerges.length > 0) {
          let nextFruits = [...currentFruits];
          allMerges.forEach(m => {
            const nextTier = m.tier + 1;
            const r = getFruitRadius(nextTier);
            // Average velocities and add small random pop upwards
            const vx = (m.f1.vx + m.f2.vx) / 2 + (Math.random() - 0.5) * 0.5;
            const vy = -3.2; // upward pop
            const mergedFruit = createFruit(nextTier, m.mx, m.my, vx, vy);

            nextFruits.push(mergedFruit);

            // Update score
            setScore(s => {
              const gained = nextTier * 10;
              const newScore = s + gained;
              if (newScore > highScore) setHighScore(newScore);
              return newScore;
            });

            // Burst particles
            const particleColor = FRUIT_TIERS[nextTier - 1]?.color || '#FF7DB4';
            spawnParticles(m.mx, m.my, particleColor);

            // Haptics
            GameHaptics.correct();
          });
          currentFruits = nextFruits;
        }

        // Game over line boundary check: top edge is above y = 80 alert line
        let isAnyFruitOverLine = false;
        currentFruits.forEach(f => {
          if (f.y - f.r_phys < 80) {
            isAnyFruitOverLine = true;
          }
        });

        if (isAnyFruitOverLine) {
          gameOverTimer.current += 16.67; // approx ms
          if (gameOverTimer.current > 1800) { // 1.8s grace period
            setGameOver(true);
            GameHaptics.incorrect(); // Game over buzz
          }
        } else {
          gameOverTimer.current = 0;
        }

        fruitsRef.current = currentFruits;
        setFruits(currentFruits);
      }

      // Update particles decay
      setParticles(prev => {
        if (prev.length === 0) return prev;
        return prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.03, // minor gravity decay
            alpha: p.alpha - 0.03,
            life: p.life - 1,
          }))
          .filter(p => p.life > 0 && p.alpha > 0);
      });

      animFrameId = requestAnimationFrame(loop);
    };

    if (!gameOver) {
      animFrameId = requestAnimationFrame(loop);
    }

    return () => cancelAnimationFrame(animFrameId);
  }, [gameOver, highScore]);

  // Touch handlers
  const handleTouch = (event) => {
    if (gameOver) return;
    const { locationX } = event.nativeEvent;
    const previewR = getFruitPhysicsRadius(previewFruitTier);
    const clampX = Math.max(previewR, Math.min(boxWidth - previewR, locationX));
    setPreviewX(clampX);
  };

  const handleTouchEnd = () => {
    if (gameOver || !isReadyToDrop.current) return;
    isReadyToDrop.current = false;

    const tier = previewFruitTier;
    const r_phys = getFruitPhysicsRadius(tier);

    // Initial drop starts dynamic and falls under gravity
    const newFruit = createFruit(tier, previewX, 40, 0, 0);

    fruitsRef.current = [...fruitsRef.current, newFruit];
    setFruits(fruitsRef.current);
    GameHaptics.correct();

    // Roll next drop preview (tiers 1-4)
    const nextTier = Math.floor(Math.random() * 4) + 1;
    setPreviewFruitTier(nextTier);
    setPreviewX(boxWidth / 2);

    setTimeout(() => {
      isReadyToDrop.current = true;
    }, 500);
  };

  const resetSandbox = () => {
    fruitsRef.current = [];
    setFruits([]);
    setParticles([]);
    setScore(0);
    setGameOver(false);
    setPreviewFruitTier(1);
    setPreviewX(boxWidth / 2);
    gameOverTimer.current = 0;
    isReadyToDrop.current = true;
    GameHaptics.correct();
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.appBg, paddingTop: insets.top }]}>
      {/* ── Custom Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            GameHaptics.correct();
            navigation.goBack();
          }}
        >
          <ArrowLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>fruit merge</Text>
        <TouchableOpacity style={styles.resetHeaderBtn} onPress={resetSandbox}>
          <RotateCcw size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ── Interactive Gameplay Area ─────────────────────────────────────────── */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Score & High Score */}
        <View style={styles.statsBar}>
          <View style={styles.statBox}>
            <Text style={styles.statsLabel}>score</Text>
            <Text style={[styles.statsValue, { color: Colors.textPrimary }]}>{score}</Text>
          </View>
          <View style={[styles.statBox, { alignItems: 'flex-end' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Award size={12} color="#F4A041" style={{ marginRight: 4 }} />
              <Text style={styles.statsLabel}>high score</Text>
            </View>
            <Text style={[styles.statsValue, { color: Colors.textPrimary }]}>{highScore}</Text>
          </View>
        </View>

        {/* Physics merge box */}
        <View style={styles.sandboxBoxOuter}>
          {/* Overfill Limit Line */}
          <View style={styles.gameOverLine} />
          <Text style={styles.gameOverLineText}>alert line</Text>

          <View
            style={styles.sandboxBox}
            onTouchStart={handleTouch}
            onTouchMove={handleTouch}
            onTouchEnd={handleTouchEnd}
          >
            {/* Guide line */}
            <View style={[styles.dropGuide, { left: previewX }]} />

            {/* Dropping Preview guide */}
            {!gameOver && (
              <View
                style={[
                  styles.previewFruitWrapper,
                  {
                    left: previewX - getFruitRadius(previewFruitTier),
                    top: 40 - getFruitRadius(previewFruitTier),
                    zIndex: 100, // Always render preview guide on top
                  },
                ]}
              >
                <FruitSvg tier={previewFruitTier} r={getFruitRadius(previewFruitTier)} />
              </View>
            )}

            {/* Active Stacking Fruits */}
            {[...fruits]
              .sort((a, b) => b.tier - a.tier) // Render larger tiers first (background) and smaller tiers last (foreground)
              .map(f => (
                <View
                  key={f.id}
                  style={[
                    styles.fruitPhysicsItem,
                    {
                      left: f.x - f.r,
                      top: f.y - f.r,
                      width: f.r * 2,
                      height: f.r * 2,
                      borderRadius: f.r,
                      transform: [{ rotate: `${f.angle || 0}rad` }],
                      zIndex: 10 - f.tier, // Explicit depth ordering (smaller tiers on top)
                    },
                  ]}
                >
                  <FruitSvg tier={f.tier} r={f.r} />
                </View>
              ))}

            {/* Sparkle Particles */}
            {particles.map(p => (
              <View
                key={p.id}
                style={{
                  position: 'absolute',
                  left: p.x - p.size / 2,
                  top: p.y - p.size / 2,
                  width: p.size,
                  height: p.size,
                  borderRadius: p.size / 2,
                  backgroundColor: p.color,
                  opacity: p.alpha,
                }}
              />
            ))}

            {/* Visible Floor Bar */}
            <View style={styles.visibleFloor} />

            {/* Game Over Modal Screen */}
            {gameOver && (
              <View style={styles.gameOverOverlay}>
                <Text style={styles.gameOverTitle}>sandbox filled!</Text>
                <Text style={styles.gameOverSubtitle}>fruits sat above the limit line. reset to stack again!</Text>
                <TouchableOpacity style={styles.restartBtn} onPress={resetSandbox}>
                  <RotateCcw size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.restartBtnText}>play again</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* ── Instructional banner ────────────────────────────────────────────── */}
        <View style={[styles.instructionsCard, Shadow.sm]}>
          <HelpCircle size={15} color="#8F857D" style={{ marginRight: 8 }} />
          <Text style={styles.instructionsText}>
            tap or drag at the top to drop fruits. merge identical fruits to pop them into larger sizes!
          </Text>
        </View>



        <View style={{ height: Spacing[10] }} />
      </ScrollView>
    </View>
  );
}

// ── Styles Definition ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    height: 48,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 18,
    textTransform: 'lowercase',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 350,
    marginTop: Spacing[2],
    marginBottom: Spacing[3],
  },
  statBox: {
    flex: 1,
  },
  statsLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 9,
    color: '#8F857D',
    textTransform: 'lowercase',
  },
  statsValue: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 18,
    marginTop: 2,
  },
  sandboxBoxOuter: {
    width: 350,
    height: 500,
    borderRadius: Radius.md,
    borderWidth: 2.5,
    borderColor: '#1D2340', // clean navy outline
    backgroundColor: '#FAF6F0', // cozy sand box warm linen
    overflow: 'hidden',
    position: 'relative',
    ...Shadow.sm,
  },
  sandboxBox: {
    flex: 1,
    position: 'relative',
  },
  visibleFloor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 16,
    backgroundColor: '#8F857D', // Cozy warm brown matching buttons/text
    borderTopWidth: 2,
    borderTopColor: '#1D2340', // Navy outline matching container
  },
  dropGuide: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: '#1D2340',
    opacity: 0.08,
    borderStyle: 'dashed',
    borderWidth: 1,
  },
  gameOverLine: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: '#F07060', // brand red/coral
    opacity: 0.35,
  },
  gameOverLineText: {
    position: 'absolute',
    top: 62,
    right: 8,
    fontFamily: Typography.fontFamily.bold,
    fontSize: 8,
    color: '#F07060',
    opacity: 0.6,
    textTransform: 'lowercase',
  },
  previewFruitWrapper: {
    position: 'absolute',
  },
  fruitPhysicsItem: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  instructionsCard: {
    width: 350,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.sm,
    padding: Spacing[3],
    marginTop: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EFE5E0',
  },
  instructionsText: {
    flex: 1,
    fontFamily: Typography.fontFamily.medium,
    fontSize: 10.5,
    color: '#8F857D',
    lineHeight: 14,
  },

  gameOverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(250, 246, 240, 0.96)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  gameOverTitle: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 22,
    color: '#F07060',
    textTransform: 'lowercase',
    marginBottom: 4,
  },
  gameOverSubtitle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 11,
    color: '#8F857D',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: Spacing[4],
    paddingHorizontal: Spacing[2],
  },
  restartBtn: {
    backgroundColor: '#8F857D',
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: 10,
  },
  restartBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 11,
    color: '#FFFFFF',
    textTransform: 'lowercase',
  },
});
