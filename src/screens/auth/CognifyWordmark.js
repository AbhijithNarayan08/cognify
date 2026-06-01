import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Path, Circle, Defs, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// SVG viewbox dimension constants matching your exact calligraphic template
const SVG_WIDTH = 328;
const SVG_HEIGHT = 107;

// Pre-computed calligraphic path lengths for C-O-G-N-I-F-Y
// This eliminates buggy runtime native getTotalLength() registry checks
const PATH_LENGTHS = [280, 300, 400, 360, 200, 380, 340];

// High-fidelity individual letter calligraphy path definitions for "COGNIFY"
const CHARACTER_PATHS = [
  {
    name: "C",
    translate: [10, 72],
    d: "M412 716Q468 716 516.5 701.0Q565 686 609 656H610L608 710H662L650 479H614Q609 573 556.0 624.0Q503 675 416 675Q363 675 315.5 652.5Q268 630 230.5 588.0Q193 546 170.5 487.0Q148 428 144 354Q139 260 171.5 188.0Q204 116 262.5 76.0Q321 36 395 36Q460 36 524.0 64.5Q588 93 631 148L656 127Q610 69 558.0 38.0Q506 7 456.5 -4.5Q407 -16 366 -16Q291 -16 231.0 11.0Q171 38 129.0 86.5Q87 135 66.5 199.5Q46 264 50 339Q54 410 78.0 477.0Q102 544 147.0 598.0Q192 652 258.5 684.0Q325 716 412 716Z"
  },
  {
    name: "O",
    translate: [68.88, 72],
    d: "M286 511Q340 511 383.0 485.5Q426 460 451.0 411.0Q476 362 476 292Q476 212 447.0 142.5Q418 73 363.5 31.0Q309 -11 231 -11Q165 -11 122.5 19.0Q80 49 59.5 100.0Q39 151 39 213Q39 294 68.5 362.0Q98 430 153.5 470.5Q209 511 286 511ZM271 474Q227 475 195.0 444.5Q163 414 145.5 362.0Q128 310 127 246Q126 212 131.0 174.0Q136 136 148.5 103.0Q161 70 183.5 49.0Q206 28 240 27Q280 26 308.0 48.5Q336 71 353.0 107.0Q370 143 378.5 184.0Q387 225 388 261Q389 296 384.5 333.0Q380 370 367.0 402.0Q354 434 331.0 453.5Q308 473 271 474Z"
  },
  {
    name: "G",
    translate: [114.56, 72],
    d: "M162 -271Q144 -271 119.5 -267.0Q95 -263 71.0 -253.5Q47 -244 31.0 -227.5Q15 -211 14 -187Q14 -173 20.0 -161.5Q26 -150 37.0 -143.0Q48 -136 61 -136Q79 -136 92.5 -147.5Q106 -159 106 -182Q106 -194 100 -208Q110 -223 130.5 -229.5Q151 -236 169 -236Q226 -236 259.5 -206.0Q293 -176 311.0 -126.5Q329 -77 337 -19Q346 40 350.0 101.5Q354 163 361 213H358Q337 141 314.0 96.5Q291 52 267.0 28.5Q243 5 219.5 -3.0Q196 -11 173 -11Q127 -11 97.0 14.5Q67 40 52.5 84.0Q38 128 38 183Q38 248 55.5 306.5Q73 365 108.5 411.5Q144 458 199.5 484.5Q255 511 330 511Q364 511 398.5 506.5Q433 502 457 494Q453 434 448.5 372.0Q444 310 438.5 249.0Q433 188 428.0 129.0Q423 70 418 14Q410 -83 377.5 -146.0Q345 -209 290.5 -240.0Q236 -271 162 -271ZM194 36Q222 36 248.5 63.5Q275 91 297.5 136.5Q320 182 337.5 238.0Q355 294 366.0 352.5Q377 411 380 462Q367 469 349.5 472.0Q332 475 314 475Q259 475 222.0 448.5Q185 422 163.0 379.5Q141 337 131.5 289.5Q122 242 122 200Q122 154 128.5 117.0Q135 80 151.0 58.0Q167 36 194 36Z"
  },
  {
    name: "N",
    translate: [160, 72],
    d: "M473 -11Q426 -11 409.0 14.0Q392 39 392 85Q392 113 396.5 151.0Q401 189 407.5 232.0Q414 275 418.5 319.0Q423 363 423 403Q423 415 419.5 429.0Q416 443 406.0 453.5Q396 464 376 464Q348 464 320.0 438.0Q292 412 267.0 368.0Q242 324 222.0 270.5Q202 217 190.5 160.5Q179 104 179 53Q179 38 179.5 25.5Q180 13 181 0H97Q96 7 96.0 12.5Q96 18 96 26Q96 43 98.0 65.5Q100 88 104.5 125.5Q109 163 116 226Q123 285 126.5 318.0Q130 351 132.0 368.5Q134 386 134.5 395.5Q135 405 135 416Q135 434 130.0 447.5Q125 461 108 461Q92 461 71.0 439.0Q50 417 35 364L7 370Q10 388 19.5 411.5Q29 435 45.0 458.0Q61 481 84.0 496.0Q107 511 137 511Q171 511 187.5 492.5Q204 474 208.5 445.0Q213 416 211 383Q209 355 204.5 329.0Q200 303 196 283H199Q233 374 266.0 423.5Q299 473 331.5 492.0Q364 511 396 511Q436 511 460.0 493.0Q484 475 494.5 445.5Q505 416 505 381Q505 326 497.5 268.5Q490 211 482.5 162.5Q475 114 475 85Q475 67 479.5 53.0Q484 39 502 39Q519 39 539.5 60.5Q560 82 575 136L603 129Q600 112 590.5 88.0Q581 64 565.0 41.5Q549 19 526.0 4.0Q503 -11 473 -11Z"
  },
  {
    name: "I",
    translate: [213.2, 72],
    d: "M133 511Q175 511 196.0 482.5Q217 454 217 407Q217 377 211.5 338.5Q206 300 198.0 256.0Q190 212 184.5 167.5Q179 123 179 81Q179 61 186.5 50.0Q194 39 210 39Q227 39 247.5 61.0Q268 83 283 136L311 130Q307 109 297.5 84.5Q288 60 273.0 38.5Q258 17 236.5 3.0Q215 -11 187 -11Q141 -11 119.0 13.0Q97 37 97 83Q97 127 103.0 168.5Q109 210 116.5 250.5Q124 291 130.0 332.0Q136 373 136 416Q136 429 130.5 445.0Q125 461 108 461Q92 461 71.0 439.0Q50 417 35 364L7 370Q10 388 19.0 411.5Q28 435 43.5 458.0Q59 481 81.0 496.0Q103 511 133 511ZM190 727Q213 727 228.0 711.5Q243 696 243 670Q243 645 227.0 629.5Q211 614 189 614Q167 614 151.5 629.5Q136 645 136 670Q136 696 152.0 711.5Q168 727 190 727Z"
  },
  {
    name: "F",
    translate: [243.12, 72],
    d: "M316 760Q353 761 373.0 747.5Q393 734 393 708Q393 701 389.5 691.0Q386 681 377.0 674.5Q368 668 353 668Q334 668 323.0 682.0Q312 696 313 718Q310 720 301.0 721.5Q292 723 284 722Q260 720 244.5 702.5Q229 685 219.0 655.5Q209 626 203.0 586.5Q197 547 193 500H335L332 461L190 459Q189 433 187.5 406.0Q186 379 184.5 350.5Q183 322 181.0 293.5Q179 265 176 236Q169 163 163.0 90.5Q157 18 145.5 -47.0Q134 -112 112.0 -162.5Q90 -213 51.5 -242.0Q13 -271 -47 -271Q-85 -271 -105.0 -257.5Q-125 -244 -125 -219Q-125 -211 -121.0 -201.5Q-117 -192 -108.0 -184.5Q-99 -177 -84 -178Q-66 -179 -55.5 -191.5Q-45 -204 -45 -224Q-34 -232 -16 -232Q19 -232 37.5 -195.0Q56 -158 65.0 -92.5Q74 -27 79.5 59.5Q85 146 94 245Q96 272 98.0 299.0Q100 326 102.0 353.0Q104 380 106.5 406.5Q109 433 112 458L24 457L29 500H117Q128 573 149.0 631.0Q170 689 210.0 724.0Q250 759 316 760Z"
  },
  {
    name: "Y",
    translate: [273.12, 72],
    d: "M64 -271Q30 -269 9.0 -251.5Q-12 -234 -12 -208Q-12 -185 2.0 -173.5Q16 -162 29 -162Q74 -162 72 -214Q78 -217 83.0 -219.0Q88 -221 94 -221Q116 -222 139.5 -205.0Q163 -188 184.5 -162.5Q206 -137 222.5 -112.5Q239 -88 247 -75Q238 -17 226.0 44.5Q214 106 198.5 167.5Q183 229 164.5 286.5Q146 344 125 395Q118 412 107.0 430.0Q96 448 76 446Q57 444 47.5 416.0Q38 388 42 342L10 338Q7 365 9.5 395.0Q12 425 22.0 451.5Q32 478 51.0 494.5Q70 511 101 511Q135 511 156.5 493.0Q178 475 191.5 449.0Q205 423 214 398Q233 347 251.0 281.0Q269 215 282.5 146.5Q296 78 303 19H305Q333 68 359.0 127.0Q385 186 402.0 247.5Q419 309 419 363Q419 388 414.5 407.0Q410 426 404 434Q400 431 393.5 429.5Q387 428 379 428Q361 428 350.0 439.5Q339 451 339 467Q339 489 353.5 500.0Q368 511 386 511Q417 511 434.0 492.0Q451 473 458.5 444.0Q466 415 466 383Q466 317 447.0 248.0Q428 179 397.5 112.0Q367 45 333 -17Q283 -107 237.5 -164.0Q192 -221 149.0 -246.5Q106 -272 64 -271Z"
  }
];

export default function CognifyWordmark({
  activePhase = 'idle',
  onWritingComplete,
  onFillComplete,
  Colors,
  color = '#FDF5EB'
}) {
  // Standard Animated timing progress values for sequential handwriting
  const drawProgresses = useRef([...Array(7)].map(() => new Animated.Value(0))).current;
  const penProgress = useRef(new Animated.Value(0)).current;

  // Crossfade opacity values
  const strokeOpacity = useRef(new Animated.Value(1)).current;
  const fillOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activePhase === 'writing') {
      // Reset values safely on the JS thread
      drawProgresses.forEach(anim => anim.setValue(0));
      Animated.timing(penProgress, { toValue: 0, duration: 0, useNativeDriver: false }).start();
      Animated.timing(strokeOpacity, { toValue: 1, duration: 0, useNativeDriver: false }).start();
      Animated.timing(fillOpacity, { toValue: 0, duration: 0, useNativeDriver: false }).start();

      // Act 1: Sequential timing of the 7 calligraphy characters (totaling 1800ms)
      const animations = drawProgresses.map((anim) => {
        return Animated.timing(anim, {
          toValue: 1,
          duration: 1800 / 7, // ~257ms per letter
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: false, // SVG stroke props must run on JS thread driving
        });
      });

      // Synchronized glowing pen dot swipe matching the 1800ms timeline
      Animated.parallel([
        Animated.sequence(animations),
        Animated.timing(penProgress, {
          toValue: 1,
          duration: 1800,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: false, // Must be false to sync perfectly with JS-driven stroke drawing
        })
      ]).start(({ finished }) => {
        if (finished && onWritingComplete) {
          onWritingComplete();
        }
      });
    } else if (activePhase === 'filling') {
      // Act 1 Crossfade: fade out stroke outlines, fade in pure white fill over 300ms
      Animated.parallel([
        Animated.timing(strokeOpacity, {
          toValue: 0,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(fillOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        })
      ]).start(({ finished }) => {
        if (finished && onFillComplete) {
          onFillComplete();
        }
      });
    } else if (activePhase === 'login' || activePhase === 'ready') {
      // Snap to solid layout directly using JS thread snaps
      drawProgresses.forEach(anim => anim.setValue(1));
      Animated.timing(penProgress, { toValue: 1, duration: 0, useNativeDriver: false }).start();
      Animated.timing(strokeOpacity, { toValue: 0, duration: 0, useNativeDriver: false }).start();
      Animated.timing(fillOpacity, { toValue: 1, duration: 0, useNativeDriver: false }).start();
    }
  }, [activePhase]);

  // Precise coordinates tracking wiggling organically through strokes (centered in 328x107 viewBox)
  const penX = penProgress.interpolate({
    inputRange:  [0,  0.14, 0.28, 0.42, 0.57, 0.71, 0.85, 1.0],
    outputRange: [25, 62,   102,  148,  204,  236,  272,  310]
  });

  const penY = penProgress.interpolate({
    inputRange:  [0,  0.07, 0.14, 0.21, 0.28, 0.35, 0.42, 0.50, 0.57, 0.64, 0.71, 0.78, 0.85, 0.92, 1.0],
    outputRange: [60, 30,   75,   35,   75,   40,   95,   35,   75,   35,   55,   20,   75,   15,   98]
  });

  const penTipStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SVG_WIDTH,
    height: SVG_HEIGHT,
    transform: [
      { translateX: penX },
      { translateY: penY }
    ],
    opacity: penProgress.interpolate({
      inputRange: [0, 0.05, 0.95, 1.0],
      outputRange: [0, 0.95, 0.95, 0]
    })
  };

  return (
    <View style={styles.container}>
      <Svg width={SVG_WIDTH} height={SVG_HEIGHT} viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}>
        <Defs>
          {/* Subtle warm calligraphy glow filter (#FDF5EB) */}
          <Filter id="glow" x="-25%" y="-25%" width="150%" height="150%">
            <FeGaussianBlur stdDeviation="1.8" result="blur" />
            <FeMerge>
              <FeMergeNode in="blur" />
              <FeMergeNode in="SourceGraphic" />
            </FeMerge>
          </Filter>
        </Defs>

        {/* Cursive Writing Path (Animated Stroke) */}
        {CHARACTER_PATHS.map((char, index) => {
          const strokeDashoffset = drawProgresses[index].interpolate({
            inputRange: [0, 1],
            outputRange: [PATH_LENGTHS[index], 0]
          });

          return (
            <AnimatedPath
              key={`stroke-${char.name}`}
              transform={`translate(${char.translate[0]},${char.translate[1]}) scale(0.08,-0.08)`}
              d={char.d}
              fill="none"
              stroke={color}
              strokeWidth="13"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              strokeDasharray={`${PATH_LENGTHS[index]} ${PATH_LENGTHS[index]}`}
              strokeDashoffset={strokeDashoffset}
              strokeOpacity={strokeOpacity}
            />
          );
        })}

        {/* Solid Wordmark Path (Pen Lift Phase) */}
        {CHARACTER_PATHS.map((char) => (
          <AnimatedPath
            key={`fill-${char.name}`}
            transform={`translate(${char.translate[0]},${char.translate[1]}) scale(0.08,-0.08)`}
            d={char.d}
            fill={color}
            stroke="none"
            filter="url(#glow)"
            fillOpacity={fillOpacity}
          />
        ))}
      </Svg>

      {/* Traveling glowing pen-tip dot */}
      <Animated.View style={penTipStyle} pointerEvents="none">
        <Svg width={10} height={10}>
          <Circle cx="5" cy="5" r="3.5" fill="#FFFFFF" opacity="0.9" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SVG_WIDTH,
    height: SVG_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
});
