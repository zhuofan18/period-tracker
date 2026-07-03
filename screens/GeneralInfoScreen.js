import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

const QUESTIONS = [
  {
    id: 'weight',
    question: 'What is your weight?',
    subtitle: 'This helps us personalise your experience.',
    type: 'input',
    placeholder: 'Enter weight in kg',
    keyboardType: 'numeric',
  },
  {
    id: 'height',
    question: 'What is your height?',
    subtitle: 'This helps us personalise your experience.',
    type: 'height',
  },
  {
    id: 'cycle_length',
    question: 'How long is your typical cycle?',
    subtitle: 'Count the days from the first day of one period to the first day of the next.',
    type: 'numeric-input',
    placeholder: 'e.g. 28',
    unit: 'days',
  },
  {
    id: 'period_length',
    question: 'How long does your period usually last?',
    subtitle: 'Count from the first day of bleeding to the last.',
    type: 'numeric-input',
    placeholder: 'e.g. 5',
    unit: 'days',
  },
  {
    id: 'help_with',
    question: 'What can we help you do?',
    subtitle: 'Choose as many as you like.',
    type: 'multi',
    options: [
      'Sync my sex life with my cycle',
      'Make masturbation work for me',
      'Spot signs of PCOS or Endometriosis',
      'Decode my discharge',
      'Manage symptoms and moods',
      'Learn how to orgasm',
    ],
  },
  {
    id: 'period_feeling',
    question: 'How do you feel about your period?',
    type: 'single',
    options: [
      "It's a love-hate relationship 🤔",
      'Embarrassed 🫣',
      'Hate it 😤',
      'I want to understand it better 🤔',
      "We've become friends 😌",
    ],
  },
  {
    id: 'period_regular',
    question: 'Are your periods regular?',
    subtitle: 'This would mean the gap between your periods is around the same number of days each month.',
    type: 'single',
    options: ['Yes', 'No', "I don't know"],
  },
  {
    id: 'birth_control',
    question: 'What birth control do you use, if any?',
    subtitle: "We're asking because some types of birth control can impact your cycle.",
    type: 'single',
    options: [
      'Nothing',
      'Pill, patch or ring',
      'Progestin-only pill (POPs or Mini pills)',
      'Implant or injection',
      'Hormonal IUD',
      'Copper IUD (Non-hormonal)',
      'Condoms (male or female)',
      'Pull-out method',
      'Tracking ovulation',
      'Something else or prefer not to say',
    ],
  },
  {
    id: 'health_conditions',
    question: 'Do you experience any of these health conditions?',
    subtitle: 'Choose all that apply.',
    type: 'multi',
    options: [
      'Yeast infections',
      'Urinary tract infections (UTIs)',
      'Bacterial Vaginosis (BV)',
      'Polycystic ovary syndrome (PCOS)',
      'Endometriosis',
      'Fibroids',
      "I'm not sure",
      'No, none of the above',
    ],
  },
  {
    id: 'today_feeling',
    question: 'How do you feel today?',
    subtitle: 'Select your symptoms',
    type: 'multi',
    options: ['Cramps', 'Fatigue', 'Bloating', 'Tender breasts', 'Backache', 'None of these'],
  },
  {
    id: 'discharge_knowledge',
    question: 'Did you know your discharge changes throughout your cycle?',
    type: 'single',
    options: ['Yes', 'No'],
  },
  {
    id: 'cycle_symptoms',
    question: 'Do you experience any cycle-related symptoms?',
    subtitle: 'Select all that apply',
    type: 'multi',
    options: [
      'Cramps',
      'Spotting',
      'Bloating',
      'Mood swings',
      'Headaches',
      'Fatigue',
      'Tender breasts',
      'Backache',
    ],
  },
  {
    id: 'mental_health',
    question: 'Does your cycle impact any aspect of your mental health?',
    subtitle: 'More than half of users say this app helps them better understand how their cycle affects their mental health.',
    type: 'multi',
    options: [
      'Mood swings',
      'Anxiety',
      'Fatigue',
      'Irritability',
      'Low mood',
      'I have Premenstrual Dysphoric Disorder (PMDD)',
      'Nope, nothing I can think of',
      "Not sure but I'd like to know more",
    ],
  },
  {
    id: 'cycle_sleep',
    question: 'Does your cycle impact your sleep?',
    subtitle: '69% of users say this app helps them sleep better.',
    type: 'single',
    options: ['Yes', 'No', "I'm not sure"],
  },
  {
    id: 'cycle_skin',
    question: 'Does your cycle impact your skin?',
    subtitle: '1 in 2 users say this app helps them improve their skin.',
    type: 'single',
    options: ['Yes', 'No', "I'm not sure"],
  },
  {
    id: 'cycle_diet',
    question: 'Does your cycle impact your diet?',
    subtitle: '66% of users say this app helps them improve their diet.',
    type: 'single',
    options: ['Yes', 'No', "I'm not sure"],
  },
  {
    id: 'sex_life_change',
    question: 'Do you want to change anything about your sex life?',
    subtitle: 'Nearly 1 in 4 users say this app helps them learn more about pleasure during sex.',
    type: 'multi',
    options: [
      'Better orgasms',
      'Improved sex drive',
      'Increased intimacy',
      'Sex positions',
      'Make sex less painful',
      'Nope, everything is great!',
      "I'm not sexually active right now",
    ],
  },
  {
    id: 'sex_life_24h',
    question: 'Tell us about your sex life in the past 24 hours',
    subtitle: 'Select all that apply',
    type: 'multi',
    options: [
      'Protected sex',
      'Unprotected sex',
      'Masturbation',
      'High sex drive',
      'Orgasm',
      'None of these',
    ],
  },
  {
    id: 'sleep_improve',
    question: 'What aspect of your sleep would you like to improve?',
    subtitle: "Choose as many as you'd like.",
    type: 'multi',
    options: [
      'Falling asleep faster',
      'Staying asleep through the night',
      'Waking up feeling more rested',
      'Improving sleep quality overall',
      'Creating a better bedtime routine',
      "I'm not looking to improve anything",
    ],
  },
  {
    id: 'sleep_hours',
    question: 'How many hours of sleep do you usually get?',
    subtitle: 'Experts recommend around 7 to 9 hours of sleep a night to feel your best.',
    type: 'single',
    options: ['Less than 6 hours', '6-7 hours', '7-9 hours', '9-10 hours', 'More than 10 hours'],
  },
];

const TOTAL = QUESTIONS.length;

export default function GeneralInfoScreen({ navigation }) {
  const { theme } = useTheme();
  const s = styles(theme);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [weightValue, setWeightValue]       = useState('');
  const [heightUnit, setHeightUnit]         = useState('cm');
  const [heightCm, setHeightCm]             = useState('');
  const [heightFt, setHeightFt]             = useState('');
  const [heightIn, setHeightIn]             = useState('');
  const [cycleLengthValue, setCycleLengthValue]   = useState('28');
  const [periodLengthValue, setPeriodLengthValue] = useState('5');

  const current = QUESTIONS[step];
  const selected = answers[current.id] || [];
  const progress = (step + 1) / TOTAL;

  const toggleOption = (option) => {
    if (current.type === 'single') {
      setAnswers((prev) => ({ ...prev, [current.id]: [option] }));
      setTimeout(() => goNext(), 300);
    } else {
      setAnswers((prev) => {
        const existing = prev[current.id] || [];
        const updated = existing.includes(option)
          ? existing.filter((o) => o !== option)
          : [...existing, option];
        return { ...prev, [current.id]: updated };
      });
    }
  };

  const goNext = async () => {
    if (step < TOTAL - 1) {
      setStep((n) => n + 1);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').upsert({
          id:            user.id,
          weight:        weightValue ? parseFloat(weightValue) : null,
          height_unit:   heightUnit,
          height_cm:     heightCm ? parseFloat(heightCm) : null,
          height_ft:     heightFt ? parseInt(heightFt) : null,
          height_in:     heightIn ? parseInt(heightIn) : null,
          cycle_length:  cycleLengthValue ? parseInt(cycleLengthValue) : 28,
          period_length: periodLengthValue ? parseInt(periodLengthValue) : 5,
          updated_at:    new Date().toISOString(),
        });
      }
      navigation.navigate('CycleSetup');
    }
  };

  const goBack = () => {
    if (step === 0) {
      navigation.goBack();
    } else {
      setStep((n) => n - 1);
    }
  };

  const isSelected = (option) => selected.includes(option);

  const canNext =
    current.type === 'multi'
      ? selected.length > 0
      : current.type === 'input'
      ? weightValue.trim().length > 0
      : current.type === 'height'
      ? (heightUnit === 'cm' ? heightCm.trim().length > 0 : heightFt.trim().length > 0)
      : current.type === 'numeric-input'
      ? (current.id === 'cycle_length' ? cycleLengthValue.trim().length > 0 : periodLengthValue.trim().length > 0)
      : false;

  return (
    <View style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={goBack} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={s.progressBarContainer}>
          <View style={[s.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
        <TouchableOpacity onPress={goNext} style={s.skipBtn}>
          <Text style={s.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {current.subtitle ? (
          <Text style={s.subtitle}>{current.subtitle}</Text>
        ) : null}

        <Text style={s.question}>{current.question}</Text>

        {current.type === 'input' ? (
          <TextInput
            style={s.weightInput}
            placeholder={current.placeholder}
            placeholderTextColor={theme.placeholder}
            keyboardType={current.keyboardType}
            value={weightValue}
            onChangeText={(val) => setWeightValue(val.replace(/[^0-9]/g, ''))}
          />
        ) : current.type === 'numeric-input' ? (
          <View>
            <TextInput
              style={s.weightInput}
              placeholder={current.placeholder}
              placeholderTextColor={theme.placeholder}
              keyboardType="numeric"
              value={current.id === 'cycle_length' ? cycleLengthValue : periodLengthValue}
              onChangeText={(val) => {
                const clean = val.replace(/[^0-9]/g, '');
                if (current.id === 'cycle_length') setCycleLengthValue(clean);
                else setPeriodLengthValue(clean);
              }}
            />
            <Text style={s.unitLabel}>{current.unit}</Text>
          </View>
        ) : current.type === 'height' ? (
          <View>
            <View style={s.unitToggle}>
              {[['cm', 'Centimeters'], ['ft', 'Feet & Inches']].map(([unit, label]) => (
                <TouchableOpacity
                  key={unit}
                  style={[s.unitBtn, heightUnit === unit && s.unitBtnSelected]}
                  onPress={() => setHeightUnit(unit)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.unitBtnText, heightUnit === unit && s.unitBtnTextSelected]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {heightUnit === 'cm' ? (
              <TextInput
                style={s.weightInput}
                placeholder="e.g. 165"
                placeholderTextColor={theme.placeholder}
                keyboardType="numeric"
                value={heightCm}
                onChangeText={(val) => setHeightCm(val.replace(/[^0-9]/g, ''))}
              />
            ) : (
              <View style={s.ftInRow}>
                <View style={s.ftInputWrap}>
                  <TextInput
                    style={s.weightInput}
                    placeholder="ft"
                    placeholderTextColor={theme.placeholder}
                    keyboardType="numeric"
                    value={heightFt}
                    onChangeText={(val) => setHeightFt(val.replace(/[^0-9]/g, ''))}
                  />
                  <Text style={s.ftLabel}>feet</Text>
                </View>
                <View style={s.ftInputWrap}>
                  <TextInput
                    style={s.weightInput}
                    placeholder="in"
                    placeholderTextColor={theme.placeholder}
                    keyboardType="numeric"
                    value={heightIn}
                    onChangeText={(val) => setHeightIn(val.replace(/[^0-9]/g, ''))}
                  />
                  <Text style={s.ftLabel}>inches</Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={s.optionsList}>
            {current.options.map((option) => {
              const active = isSelected(option);
              return (
                <TouchableOpacity
                  key={option}
                  style={[s.option, active && s.optionSelected]}
                  onPress={() => toggleOption(option)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.optionText, active && s.optionTextSelected]}>
                    {option}
                  </Text>
                  {current.type === 'multi' && (
                    <View style={[s.radio, active && s.radioSelected]}>
                      {active && <View style={s.radioDot} />}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {(current.type === 'multi' || current.type === 'input' || current.type === 'height' || current.type === 'numeric-input') && (
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.nextBtn, !canNext && s.nextBtnDisabled]}
            onPress={goNext}
            disabled={!canNext}
          >
            <Text style={s.nextBtnText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = (theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 40 : 50, paddingBottom: 12, gap: 8 },
  backBtn: { padding: 4 },
  backArrow: { fontSize: 22, color: theme.text },
  progressBarContainer: { flex: 1, height: 4, backgroundColor: theme.border, borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: theme.text, borderRadius: 2 },
  skipBtn: { padding: 4 },
  skipText: { fontSize: 14, color: theme.muted },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  subtitle: { fontSize: 13, color: theme.muted, textAlign: 'center', marginBottom: 12, lineHeight: 18 },
  question: { fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 28, lineHeight: 32 },
  optionsList: { gap: 10 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.optionBg, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 16, borderWidth: 2, borderColor: 'transparent' },
  optionSelected: { backgroundColor: theme.primaryLight, borderColor: theme.primary },
  optionText: { fontSize: 15, color: theme.text, flex: 1 },
  optionTextSelected: { color: theme.primary, fontWeight: '600' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.border, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  radioSelected: { borderColor: theme.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.primary },
  weightInput: { borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: theme.text, backgroundColor: theme.inputBg },
  unitLabel:   { fontSize: 13, color: theme.muted, marginTop: 8, textAlign: 'center' },
  unitToggle: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  unitBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: theme.border, backgroundColor: theme.optionBg, alignItems: 'center' },
  unitBtnSelected: { backgroundColor: theme.primaryLight, borderColor: theme.primary },
  unitBtnText: { fontSize: 14, color: theme.subtext, fontWeight: '500' },
  unitBtnTextSelected: { color: theme.primary, fontWeight: '700' },
  ftInRow: { flexDirection: 'row', gap: 12 },
  ftInputWrap: { flex: 1 },
  ftLabel: { fontSize: 12, color: theme.muted, marginTop: 6, textAlign: 'center' },
  footer: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: theme.background },
  nextBtn: { backgroundColor: theme.primary, borderRadius: 30, paddingVertical: 16, alignItems: 'center' },
  nextBtnDisabled: { backgroundColor: '#f2b8cc' },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
