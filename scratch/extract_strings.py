# /Users/abhijith.narayan/.gemini/antigravity/brain/dc1bb1cb-7f9f-4f24-b6ee-5391699c9fba/scratch/extract_strings.py
import os
import re
import csv

base_dir = "/Users/abhijith.narayan/Downloads/cognify"

# Load existing strings.csv to see what we have
existing_strings = []
strings_csv_path = os.path.join(base_dir, "src/constants/strings.csv")

if os.path.exists(strings_csv_path):
    with open(strings_csv_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader, None)
        for row in reader:
            if not row or row[0].startswith('#'):
                continue
            # Row structure: key, value, screen, notes
            if len(row) >= 2:
                key = row[0].strip()
                # Skip header rows if accidentally parsed
                if key.lower() == 'key':
                    continue
                existing_strings.append({
                    'key': key,
                    'value': row[1].strip(),
                    'screen': row[2].strip() if len(row) > 2 else '',
                    'notes': row[3].strip() if len(row) > 3 else ''
                })

print(f"Loaded {len(existing_strings)} existing strings from strings.csv")

# We want to scan the entire active codebase (excluding legacy files)
files_to_scan = []
legacy_files = {'FlashSortGame.js', 'SequenceRecallGame.js', 'WordMatchGame.js'}

for root, dirs, files in os.walk(os.path.join(base_dir, "src")):
    for file in files:
        if file.endswith(('.js', '.jsx', '.ts', '.tsx')):
            if file not in legacy_files:
                files_to_scan.append(os.path.join(root, file))

print(f"Found {len(files_to_scan)} active source files to scan.")

# Let's map each existing string to its file & component by scanning where its t() key is used.
string_mappings = []
used_keys = set()

# Regex to find t('key') or t("key") or t(`key`)
t_pattern = re.compile(r"\bt\(\s*['\"`]([a-zA-Z0-9\._\-]+)['\"`]")

# Let's scan all files for t() usage or hardcoded text
for file_path in files_to_scan:
    rel_path = os.path.relpath(file_path, base_dir)
    file_name = os.path.basename(file_path)
    component_name = os.path.splitext(file_name)[0]
    
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        
    # Find t() calls
    matches = t_pattern.findall(content)
    for key in matches:
        # Skip dynamic/partial keys
        if key.endswith('.'):
            continue
        if key.lower() == 'key':
            continue
            
        used_keys.add(key)
        
        # Check special overrides/missing fallbacks in active code
        if key == 'profile.goal.staySharp':
            string_mappings.append({
                'key': key,
                'value': 'stay sharp',
                'file': 'src/screens/main/ProfileScreen.js',
                'component': 'ProfileScreen',
                'notes': 'Fallback default goal in profile screen'
            })
            continue
            
        if key == 'insights.deltaText.baseline':
            string_mappings.append({
                'key': key,
                'value': 'baseline',
                'file': 'src/screens/main/InsightsScreen.js',
                'component': 'InsightsScreen',
                'notes': 'Label for baseline score comparisons'
            })
            continue
            
        # Find if this key is in existing strings
        found = False
        for s in existing_strings:
            if s['key'] == key:
                string_mappings.append({
                    'key': key,
                    'value': s['value'],
                    'file': rel_path,
                    'component': component_name,
                    'notes': s['notes']
                })
                found = True
        if not found:
            # Missing key in strings.csv but used in code
            string_mappings.append({
                'key': key,
                'value': f"MISSING VALUE FOR {key}",
                'file': rel_path,
                'component': component_name,
                'notes': f"Key found in code but missing in strings.csv"
            })

# Let's also look for hardcoded strings in specific files we worked on recently:
# 1. LoginScreen.js
# 2. LoginForm.js
# 3. NotificationOptInScreen.js
# 4. PatternFoldResults.js
# 5. MascotCharacters.js
# 6. patternFoldAnalytics.js

# Hardcode direct extractions for these files to ensure perfect accuracy
hardcoded_extractions = [
    # LoginScreen.js
    {
        'key': 'auth.login.skip_intro',
        'value': 'skip intro',
        'file': 'src/screens/auth/LoginScreen.js',
        'component': 'LoginScreen',
        'notes': 'Button label to bypass mascot entrance animations'
    },
    {
        'key': 'auth.login.replay_intro',
        'value': '↺ replay intro',
        'file': 'src/screens/auth/LoginScreen.js',
        'component': 'LoginScreen',
        'notes': 'Button label to replay mascot entrance animations'
    },
    
    # LoginForm.js
    {
        'key': 'auth.login.title',
        'value': 'welcome to cognify',
        'file': 'src/screens/auth/LoginForm.js',
        'component': 'LoginForm',
        'notes': 'Main headline for the authentication sheet'
    },
    {
        'key': 'auth.login.subtitle',
        'value': 'train your mind. every day.',
        'file': 'src/screens/auth/LoginForm.js',
        'component': 'LoginForm',
        'notes': 'Subtitle under the welcome headline'
    },
    {
        'key': 'auth.login.terms_agreement_part1',
        'value': "I agree to Cognify's ",
        'file': 'src/screens/auth/LoginForm.js',
        'component': 'LoginForm',
        'notes': 'Prefix for terms and conditions checkbox text'
    },
    {
        'key': 'auth.login.terms_link',
        'value': 'Terms & Conditions',
        'file': 'src/screens/auth/LoginForm.js',
        'component': 'LoginForm',
        'notes': 'Terms and conditions clickable link text'
    },
    {
        'key': 'auth.login.privacy_agreement_part',
        'value': ' and acknowledge the ',
        'file': 'src/screens/auth/LoginForm.js',
        'component': 'LoginForm',
        'notes': 'Conjunction text between terms and privacy links'
    },
    {
        'key': 'auth.login.privacy_link',
        'value': 'Privacy Policy',
        'file': 'src/screens/auth/LoginForm.js',
        'component': 'LoginForm',
        'notes': 'Privacy policy clickable link text'
    },
    {
        'key': 'auth.login.create_account',
        'value': 'create an account',
        'file': 'src/screens/auth/LoginForm.js',
        'component': 'LoginForm',
        'notes': 'Primary registration CTA button'
    },
    {
        'key': 'auth.login.login_cta',
        'value': 'log in',
        'file': 'src/screens/auth/LoginForm.js',
        'component': 'LoginForm',
        'notes': 'Secondary login CTA button'
    },
    {
        'key': 'auth.login.back_to_options',
        'value': '← back to options',
        'file': 'src/screens/auth/LoginForm.js',
        'component': 'LoginForm',
        'notes': 'Back button link to return to main login buttons'
    },
    {
        'key': 'auth.login.choose_account',
        'value': 'choose account',
        'file': 'src/screens/auth/LoginForm.js',
        'component': 'LoginForm',
        'notes': 'SSO choice title'
    },
    {
        'key': 'auth.login.continue_apple',
        'value': 'continue with Apple',
        'file': 'src/screens/auth/LoginForm.js',
        'component': 'LoginForm',
        'notes': 'Apple SSO button label'
    },
    {
        'key': 'auth.login.continue_google',
        'value': 'continue with Google',
        'file': 'src/screens/auth/LoginForm.js',
        'component': 'LoginForm',
        'notes': 'Google SSO button label'
    },
    {
        'key': 'auth.login.email_login_title',
        'value': 'email login',
        'file': 'src/screens/auth/LoginForm.js',
        'component': 'LoginForm',
        'notes': 'Title above email text input field'
    },
    {
        'key': 'auth.login.email_placeholder',
        'value': 'enter your email address',
        'file': 'src/screens/auth/LoginForm.js',
        'component': 'LoginForm',
        'notes': 'Placeholder text inside email text input field'
    },
    {
        'key': 'auth.login.email_error',
        'value': 'please enter a valid email address',
        'file': 'src/screens/auth/LoginForm.js',
        'component': 'LoginForm',
        'notes': 'Validation error message for malformed emails'
    },
    {
        'key': 'auth.login.continue_email',
        'value': 'continue with email',
        'file': 'src/screens/auth/LoginForm.js',
        'component': 'LoginForm',
        'notes': 'Submit button label for email phase'
    },
    
    # NotificationOptInScreen.js
    {
        'key': 'onboarding.notifications.headline',
        'value': 'protect your training streak.',
        'file': 'src/screens/onboarding/NotificationOptInScreen.js',
        'component': 'NotificationOptInScreen',
        'notes': 'Main headline for notification opt-in screen'
    },
    {
        'key': 'onboarding.notifications.body',
        'value': "we'll send one quiet, daily nudge to keep your cognitive habits on track. no spam, ever.",
        'file': 'src/screens/onboarding/NotificationOptInScreen.js',
        'component': 'NotificationOptInScreen',
        'notes': 'Explanatory text for notification opt-in screen'
    },
    {
        'key': 'onboarding.notifications.enable',
        'value': 'enable reminders',
        'file': 'src/screens/onboarding/NotificationOptInScreen.js',
        'component': 'NotificationOptInScreen',
        'notes': 'Primary CTA button to enable notifications'
    },
    {
        'key': 'onboarding.notifications.skip',
        'value': 'skip for now',
        'file': 'src/screens/onboarding/NotificationOptInScreen.js',
        'component': 'NotificationOptInScreen',
        'notes': 'Secondary CTA button to skip notification opt-in'
    },
    {
        'key': 'onboarding.notifications.alert_title',
        'value': 'enable reminders',
        'file': 'src/screens/onboarding/NotificationOptInScreen.js',
        'component': 'NotificationOptInScreen',
        'notes': 'System alert dialog title'
    },
    {
        'key': 'onboarding.notifications.alert_body',
        'value': 'would you like to allow Cognify to send you daily notifications to keep your streak active?',
        'file': 'src/screens/onboarding/NotificationOptInScreen.js',
        'component': 'NotificationOptInScreen',
        'notes': 'System alert dialog description body'
    },
    {
        'key': 'onboarding.notifications.alert_cancel',
        'value': 'skip for now',
        'file': 'src/screens/onboarding/NotificationOptInScreen.js',
        'component': 'NotificationOptInScreen',
        'notes': 'Alert dialog cancel option'
    },
    {
        'key': 'onboarding.notifications.alert_allow',
        'value': 'allow',
        'file': 'src/screens/onboarding/NotificationOptInScreen.js',
        'component': 'NotificationOptInScreen',
        'notes': 'Alert dialog confirm option'
    },

    # patternFoldAnalytics.js Pattern Insights
    {
        'key': 'patternFold.insight.mirror_trap_prone',
        'value': "You're frequently fooled by mirror images — your brain matches shape outlines before checking rotation direction.",
        'file': 'src/features/train/games/patternFoldAnalytics.js',
        'component': 'patternFoldAnalytics',
        'notes': 'Longitudinal pattern description for MIRROR_TRAP_PRONE'
    },
    {
        'key': 'patternFold.insight.angle_270_weak',
        'value': "Your brain rotates clockwise faster than counter-clockwise — 270° is your spatial blind spot.",
        'file': 'src/features/train/games/patternFoldAnalytics.js',
        'component': 'patternFoldAnalytics',
        'notes': 'Longitudinal pattern description for ANGLE_270_WEAK'
    },
    {
        'key': 'patternFold.insight.speed_accuracy_tradeoff',
        'value': "You're deciding faster than your spatial reasoning can keep up — pause before your first tap.",
        'file': 'src/features/train/games/patternFoldAnalytics.js',
        'component': 'patternFoldAnalytics',
        'notes': 'Longitudinal pattern description for SPEED_ACCURACY_TRADEOFF'
    },
    {
        'key': 'patternFold.insight.deliberate_but_slow',
        'value': "Precise but cautious — try trusting your first instinct more, you're usually right!",
        'file': 'src/features/train/games/patternFoldAnalytics.js',
        'component': 'patternFoldAnalytics',
        'notes': 'Longitudinal pattern description for DELIBERATE_BUT_SLOW'
    },
    {
        'key': 'patternFold.insight.chirality_blind',
        'value': "You're matching overall orientation before shape — check the block structure first, then rotation.",
        'file': 'src/features/train/games/patternFoldAnalytics.js',
        'component': 'patternFoldAnalytics',
        'notes': 'Longitudinal pattern description for CHIRALITY_BLIND'
    },
    {
        'key': 'patternFold.insight.level_color_struggle',
        'value': "Multi-color shapes are disrupting your rotation tracking — focus on one color anchor per rotation.",
        'file': 'src/features/train/games/patternFoldAnalytics.js',
        'component': 'patternFoldAnalytics',
        'notes': 'Longitudinal pattern description for LEVEL_COLOR_STRUGGLE'
    },
    {
        'key': 'patternFold.insight.spatial_improvement',
        'value': "Your spatial reasoning is measurably sharper — keep the streak going!",
        'file': 'src/features/train/games/patternFoldAnalytics.js',
        'component': 'patternFoldAnalytics',
        'notes': 'Longitudinal pattern description for SPATIAL_IMPROVEMENT'
    },
    {
        'key': 'patternFold.insight.fallback',
        'value': "Keep practicing to uncover more deep insights about your unique spatial cognitive style.",
        'file': 'src/features/train/games/patternFoldAnalytics.js',
        'component': 'patternFoldAnalytics',
        'notes': 'Fallback pattern description'
    },
    {
        'key': 'patternFold.recommendation.up_reason',
        'value': 'Your mirror-trap accuracy is outstanding — ready for a tougher challenge?',
        'file': 'src/features/train/games/patternFoldAnalytics.js',
        'component': 'patternFoldAnalytics',
        'notes': 'Reason for recommending level up'
    },
    {
        'key': 'patternFold.recommendation.down_reason',
        'value': "The rotation complexity seems high. Let's build solid fundamentals at a lower level.",
        'file': 'src/features/train/games/patternFoldAnalytics.js',
        'component': 'patternFoldAnalytics',
        'notes': 'Reason for recommending level down'
    },

    # PatternFoldResults.js
    {
        'key': 'patternFold.results.domain_title',
        'value': 'SPATIAL COGNITION',
        'file': 'src/features/train/screens/PatternFoldResults.js',
        'component': 'PatternFoldResults',
        'notes': 'Bespoke spatial domain banner title'
    },
    {
        'key': 'patternFold.results.exercise_name',
        'value': 'Pattern Fold',
        'file': 'src/features/train/screens/PatternFoldResults.js',
        'component': 'PatternFoldResults',
        'notes': 'Exercise title label'
    },
    {
        'key': 'patternFold.results.tab_summary',
        'value': 'Session Summary',
        'file': 'src/features/train/screens/PatternFoldResults.js',
        'component': 'PatternFoldResults',
        'notes': 'Bespoke tab label for session summary'
    },
    {
        'key': 'patternFold.results.tab_history',
        'value': 'Progress & Trends',
        'file': 'src/features/train/screens/PatternFoldResults.js',
        'component': 'PatternFoldResults',
        'notes': 'Bespoke tab label for longitudinal trends'
    },
    {
        'key': 'patternFold.results.alert_success_template',
        'value': 'Level successfully adjusted to Level {level}!',
        'file': 'src/features/train/screens/PatternFoldResults.js',
        'component': 'PatternFoldResults',
        'notes': 'Template — system alert confirming level adjustment success'
    },
    {
        'key': 'patternFold.results.rounds_completed_label',
        'value': 'rounds completed',
        'file': 'src/features/train/screens/PatternFoldResults.js',
        'component': 'PatternFoldResults',
        'notes': 'Metric row label'
    },
    {
        'key': 'patternFold.results.accuracy_label',
        'value': 'accuracy',
        'file': 'src/features/train/screens/PatternFoldResults.js',
        'component': 'PatternFoldResults',
        'notes': 'Metric row label'
    },
    {
        'key': 'patternFold.results.longest_streak_label',
        'value': 'longest streak',
        'file': 'src/features/train/screens/PatternFoldResults.js',
        'component': 'PatternFoldResults',
        'notes': 'Metric row label'
    },
    {
        'key': 'patternFold.results.streak_suffix_template',
        'value': '{streak} in a row',
        'file': 'src/features/train/screens/PatternFoldResults.js',
        'component': 'PatternFoldResults',
        'notes': 'Template — streak value suffix description'
    },
    {
        'key': 'patternFold.results.analyze_history_cta',
        'value': 'Analyze Longitudinal History & Trends',
        'file': 'src/features/train/screens/PatternFoldResults.js',
        'component': 'PatternFoldResults',
        'notes': 'Pill link to toggle tabs'
    },
    {
        'key': 'patternFold.results.history_title',
        'value': 'session history',
        'file': 'src/features/train/screens/PatternFoldResults.js',
        'component': 'PatternFoldResults',
        'notes': 'Historical log section header'
    },
    {
        'key': 'patternFold.results.empty_history',
        'value': 'No spatial profiles logged yet. Complete more workouts to map your brain!',
        'file': 'src/features/train/screens/PatternFoldResults.js',
        'component': 'PatternFoldResults',
        'notes': 'Empty state placeholder description'
    },
    {
        'key': 'patternFold.results.level_prefix_template',
        'value': 'Level {level}',
        'file': 'src/features/train/screens/PatternFoldResults.js',
        'component': 'PatternFoldResults',
        'notes': 'Template — historical card level indicator'
    },
    {
        'key': 'patternFold.results.score_suffix_template',
        'value': '{score} pts',
        'file': 'src/features/train/screens/PatternFoldResults.js',
        'component': 'PatternFoldResults',
        'notes': 'Template — historical card score indicator'
    },
    {
        'key': 'patternFold.results.efficiency_suffix_template',
        'value': '{efficiency}% SE',
        'file': 'src/features/train/screens/PatternFoldResults.js',
        'component': 'PatternFoldResults',
        'notes': 'Template — historical card efficiency indicator'
    },
    {
        'key': 'patternFold.results.avg_speed_label',
        'value': 'Average Speed:',
        'file': 'src/features/train/screens/PatternFoldResults.js',
        'component': 'PatternFoldResults',
        'notes': 'Expanded diagnostics sub-panel row label'
    },
    {
        'key': 'patternFold.results.speed_unit_template',
        'value': '{speed}ms',
        'file': 'src/features/train/screens/PatternFoldResults.js',
        'component': 'PatternFoldResults',
        'notes': 'Template — speed millisecond unit representation'
    },
    {
        'key': 'patternFold.results.elite_speeds_label',
        'value': 'Elite Speeds:',
        'file': 'src/features/train/screens/PatternFoldResults.js',
        'component': 'PatternFoldResults',
        'notes': 'Expanded diagnostics sub-panel row label'
    },
    {
        'key': 'patternFold.results.elite_rounds_suffix_template',
        'value': '{rounds} rounds',
        'file': 'src/features/train/screens/PatternFoldResults.js',
        'component': 'PatternFoldResults',
        'notes': 'Template — elite round counts'
    },
    {
        'key': 'patternFold.results.error_attribution_title',
        'value': 'Error Attribution:',
        'file': 'src/features/train/screens/PatternFoldResults.js',
        'component': 'PatternFoldResults',
        'notes': 'Diagnostics error breakdown title'
    },
    {
        'key': 'patternFold.results.mirror_label',
        'value': 'Mirror',
        'file': 'src/features/train/screens/PatternFoldResults.js',
        'component': 'PatternFoldResults',
        'notes': 'Error attribution card label'
    },
    {
        'key': 'patternFold.results.angle_label',
        'value': 'Angle',
        'file': 'src/features/train/screens/PatternFoldResults.js',
        'component': 'PatternFoldResults',
        'notes': 'Error attribution card label'
    },
    {
        'key': 'patternFold.results.chirality_label',
        'value': 'Chiral',
        'file': 'src/features/train/screens/PatternFoldResults.js',
        'component': 'PatternFoldResults',
        'notes': 'Error attribution card label'
    },
    {
        'key': 'patternFold.results.pattern_detected_prefix_template',
        'value': 'Detected: {pattern}',
        'file': 'src/features/train/screens/PatternFoldResults.js',
        'component': 'PatternFoldResults',
        'notes': 'Template — cognitive pattern log description'
    },
    {
        'key': 'patternFold.results.next_exercise_label',
        'value': 'next exercise',
        'file': 'src/features/train/screens/PatternFoldResults.js',
        'component': 'PatternFoldResults',
        'notes': 'Primary CTA button label'
    },
    {
        'key': 'patternFold.results.done_label',
        'value': 'done',
        'file': 'src/features/train/screens/PatternFoldResults.js',
        'component': 'PatternFoldResults',
        'notes': 'Primary CTA button label'
    },
    {
        'key': 'patternFold.results.play_again_label',
        'value': 'play again',
        'file': 'src/features/train/screens/PatternFoldResults.js',
        'component': 'PatternFoldResults',
        'notes': 'Secondary CTA button label'
    }
]

# Let's add all existing strings to string_mappings, tracing them to their correct files
traced_keys = set()
for m in string_mappings:
    traced_keys.add(m['key'])

# Add existing strings that weren't caught in t() scan, resolving their exact file paths / components
for s in existing_strings:
    if s['key'] not in traced_keys:
        # Determine exact file based on key prefix
        file_path = "src/constants/strings.csv"
        comp_name = "stringsData"
        
        if s['key'].startswith('onboarding.intent.'):
            file_path = "src/screens/onboarding/IntentScreen.js"
            comp_name = "IntentScreen"
        elif s['key'].startswith('onboarding.quickProfile.'):
            file_path = "src/screens/onboarding/QuickProfileScreen.js"
            comp_name = "QuickProfileScreen"
        elif s['key'].startswith('onboarding.projection.'):
            file_path = "src/screens/onboarding/ProjectionScreen.js"
            comp_name = "ProjectionScreen"
        elif s['key'].startswith('onboarding.assessment.'):
            file_path = "src/screens/onboarding/AssessmentScreens.js"
            comp_name = "AssessmentScreens"
        elif s['key'].startswith('onboarding.assessmentIntro.'):
            file_path = "src/screens/onboarding/AssessmentScreens.js"
            comp_name = "AssessmentScreens"
        elif s['key'].startswith('onboarding.welcome.'):
            file_path = "src/screens/onboarding/WelcomeScreen.js"
            comp_name = "WelcomeScreen"
        elif s['key'].startswith('home.'):
            file_path = "src/screens/main/HomeScreen.js"
            comp_name = "HomeScreen"
        elif s['key'].startswith('insights.'):
            file_path = "src/screens/main/InsightsScreen.js"
            comp_name = "InsightsScreen"
        elif s['key'].startswith('profile.'):
            file_path = "src/screens/main/ProfileScreen.js"
            comp_name = "ProfileScreen"
        elif s['key'].startswith('train.'):
            file_path = "src/features/train/screens/TrainScreen.js"
            comp_name = "TrainScreen"
        elif s['key'].startswith('games.'):
            file_path = "src/constants/gameConfig.js"
            comp_name = "gameConfig"
            
        string_mappings.append({
            'key': s['key'],
            'value': s['value'],
            'file': file_path,
            'component': comp_name,
            'notes': s['notes']
        })

# Now add all hardcoded extractions
for hc in hardcoded_extractions:
    string_mappings.append(hc)

# Remove any duplicates in string_mappings by key
unique_mappings = {}
duplicates_count = 0
for mapping in string_mappings:
    key = mapping['key']
    if key in unique_mappings:
        duplicates_count += 1
    else:
        unique_mappings[key] = mapping

# Sort by key alphabetically
sorted_keys = sorted(unique_mappings.keys())
final_rows = [unique_mappings[k] for k in sorted_keys]

# Write strings.csv inside our scratch folder to verify
output_csv_path = os.path.join("/Users/abhijith.narayan/.gemini/antigravity/brain/dc1bb1cb-7f9f-4f24-b6ee-5391699c9fba/scratch", "extracted_strings.csv")
with open(output_csv_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['key', 'value', 'file', 'component', 'notes'])
    for row in final_rows:
        writer.writerow([row['key'], row['value'], row['file'], row['component'], row['notes']])

# Output total stats
print(f"Extraction complete. Total unique strings: {len(final_rows)}. Duplicates ignored: {duplicates_count}")
