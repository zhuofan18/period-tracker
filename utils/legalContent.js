// Shared Terms of Service / Privacy Policy content — single source of truth
// so the pre-signup LegalScreen and the in-app Profile & Settings modals
// never drift out of sync with each other.

export const PRIVACY_POLICY = [
  { heading: 'Data We Collect', body: 'We collect the information you provide during sign-up (name, email, age, height, weight) and the health data you log in the app (period dates, cycle length, symptoms, daily logs, and notes).' },
  { heading: 'How We Use Your Data', body: 'Your data is used solely to provide cycle tracking features, generate predictions, and personalise your experience. We do not sell or share your personal data with third parties.' },
  { heading: 'Data Storage & Security', body: 'Your data is stored securely using Supabase with Row Level Security — only your account can access your data. We use industry-standard encryption in transit and at rest.' },
  { heading: 'Your Rights', body: 'You can view, edit, export, or delete your personal information at any time from Profile & Settings — both data export and full account deletion are available directly in the app, no request needed.' },
  { heading: 'Contact', body: 'If you have any privacy concerns, please reach out via the Contact Us section in this app.' },
];

export const TERMS_OF_SERVICE = [
  { heading: 'Acceptance of Terms', body: 'By using this app, you agree to these Terms of Service. If you do not agree, please do not use the app.' },
  { heading: 'Not Medical Advice', body: 'This app provides general cycle tracking and wellness information only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical concerns.' },
  { heading: 'Account Responsibility', body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.' },
  { heading: 'Accuracy of Information', body: 'Cycle predictions are estimates based on your logged data. Cycles naturally vary and predictions may not always be accurate. Do not rely on this app as a method of contraception.' },
  { heading: 'Prohibited Use', body: 'You may not use this app for any unlawful purpose or in any way that could harm other users or the service.' },
  { heading: 'Changes to Terms', body: 'We may update these terms from time to time. Continued use of the app after changes constitutes acceptance of the new terms.' },
];
