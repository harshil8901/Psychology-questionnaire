import type { LikertQuestion, Questionnaire, SurveySection } from "@/types/questionnaire";

const LIKERT_5 = ["Never", "Rarely", "Sometimes", "Often", "Always"] as const;
const LIKERT_AGREE = [
  "Strongly Disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly Agree",
] as const;

function likertItems(
  sectionId: string,
  prefix: string,
  stems: string[],
  scale: readonly string[] = LIKERT_5
): LikertQuestion[] {
  return stems.map((stem, i) => ({
    id: `${prefix}_${i + 1}`,
    type: "likert" as const,
    question: stem,
    required: true,
    scale: [...scale],
    analyticsKey: sectionId,
    order: i + 1,
  }));
}

const healthBehaviourStems = [
  "I enjoy spending my free time in pleasant activities.",
  "I maintain a balanced diet during the work week.",
  "I get sufficient physical activity or exercise.",
  "I prioritize adequate sleep on most nights.",
  "I take breaks during work to recharge mentally.",
  "I manage stress through healthy coping strategies.",
  "I limit excessive caffeine or stimulant use at work.",
  "I stay hydrated and mindful of nutrition at work.",
  "I engage in hobbies that support my wellbeing.",
  "I seek medical or wellness support when needed.",
];

const workEngagementStems = [
  "I feel enthusiastic about my work.",
  "Time passes quickly when I am working.",
  "I feel energized by my job tasks.",
  "I am immersed in my work activities.",
  "My work inspires me.",
  "I am proud of the work I do.",
  "I find my work meaningful.",
  "I am willing to go the extra mile at work.",
  "I feel dedicated to my organization.",
  "I remain focused even when work is challenging.",
  "I look forward to starting my workday.",
  "I feel a strong sense of purpose in my role.",
];

const psychologicalWellbeingStems = [
  "I feel satisfied with my life overall.",
  "I experience positive emotions frequently.",
  "I feel calm and at ease most days.",
  "I can bounce back from setbacks.",
  "I feel a sense of personal growth.",
  "I have warm and trusting relationships.",
  "I feel autonomous in making life choices.",
  "I feel competent in managing daily demands.",
  "I experience moments of joy during the week.",
  "I feel hopeful about my future.",
  "I accept myself including limitations.",
  "I feel my life has direction and meaning.",
];

const organizationalSupportStems = [
  "My organization cares about employee wellbeing.",
  "My supervisor supports my professional growth.",
  "I receive constructive feedback regularly.",
  "I feel psychologically safe to speak up at work.",
  "Workplace policies support work-life balance.",
  "I have access to resources when stressed.",
  "My colleagues are supportive and collaborative.",
  "Recognition is given fairly for good work.",
  "I trust leadership to act ethically.",
  "My workload is manageable most of the time.",
  "I feel included and respected at work.",
  "My organization communicates changes transparently.",
];

const workplaceFlourishingStems = [
  "I feel I am flourishing in my workplace.",
  "I experience vitality at work.",
  "I feel deeply engaged with my organization.",
  "I contribute meaningfully to my team.",
  "I feel my strengths are utilized at work.",
  "I experience positive relationships at work.",
  "I feel optimistic about my career here.",
  "I balance work demands with personal life well.",
  "I feel valued for my contributions.",
  "I would recommend this workplace to others.",
  "I feel a sense of belonging in my organization.",
  "I see opportunities to thrive long-term here.",
  "I feel emotionally fulfilled by my work.",
  "I experience a sense of accomplishment regularly.",
];

const jobStressStems = [
  "I feel overwhelmed by work demands.",
  "I experience tension related to deadlines.",
  "Work interferes with my personal life.",
  "I feel emotionally exhausted after work.",
  "I worry about work even during off hours.",
  "I feel pressure to perform constantly.",
  "Conflicts at work drain my energy.",
  "I feel unable to disconnect from work.",
  "Uncertainty at work causes me stress.",
  "I feel burned out from my job.",
];

const resilienceStems = [
  "I adapt well to workplace changes.",
  "I recover quickly from work setbacks.",
  "I maintain perspective during difficulties.",
  "I use problem-solving when facing challenges.",
  "I seek support when work becomes difficult.",
  "I stay motivated despite obstacles.",
  "I learn from mistakes at work.",
  "I remain composed under pressure.",
  "I find meaning in difficult work experiences.",
  "I believe I can handle future work challenges.",
];

const socialConnectednessStems = [
  "I feel connected to people at work.",
  "I have someone at work I can confide in.",
  "Team collaboration feels rewarding.",
  "I participate in social activities at work.",
  "I feel loneliness is rare during work hours.",
  "I build meaningful professional relationships.",
  "I feel part of a community at work.",
  "Coworkers celebrate successes together.",
  "I feel empathy from colleagues when needed.",
  "I enjoy interacting with my team.",
];

const workLifeBalanceStems = [
  "I can disconnect from work after hours.",
  "My personal time is respected by my employer.",
  "I have flexibility when personal needs arise.",
  "I do not sacrifice health for work demands.",
  "I spend quality time with family or friends.",
  "I pursue personal interests outside work.",
  "Work schedules allow adequate rest.",
  "I feel guilt-free during time off.",
  "Boundaries between work and home are clear.",
  "I return to work feeling refreshed.",
];

const optimismStems = [
  "I expect good things in my work future.",
  "I focus on solutions rather than problems.",
  "I interpret setbacks as temporary.",
  "I believe effort leads to positive outcomes.",
  "I maintain hope during difficult projects.",
  "I see opportunities in workplace challenges.",
  "I anticipate success in my goals.",
  "I feel confident about handling work demands.",
];

const sections: SurveySection[] = [
  {
    id: "demographics",
    title: "Demographic Details",
    description: "Tell us a little about yourself. Your responses help us understand our sample.",
    icon: "user",
    estimatedTime: 2,
    themeGradient: "from-cyan-500 to-blue-500",
    questions: [
      {
        id: "name",
        type: "text",
        question: "Name",
        required: true,
        placeholder: "Enter your name",
        analyticsKey: "demographics",
        order: 1,
      },
      {
        id: "age",
        type: "text",
        question: "Age",
        required: true,
        placeholder: "Enter your age",
        analyticsKey: "demographics",
        order: 2,
      },
      {
        id: "gender",
        type: "single_choice",
        question: "Gender",
        required: true,
        options: ["Male", "Female", "Non-binary", "Prefer not to say"],
        analyticsKey: "demographics",
        order: 3,
      },
      {
        id: "education",
        type: "single_choice",
        question: "Highest education level",
        required: true,
        options: [
          "High school",
          "Bachelor's degree",
          "Master's degree",
          "Doctorate",
          "Other",
        ],
        analyticsKey: "demographics",
        order: 4,
      },
      {
        id: "experience",
        type: "single_choice",
        question: "Years of work experience",
        required: true,
        options: ["Less than 2", "2–5", "6–10", "11–20", "More than 20"],
        analyticsKey: "demographics",
        order: 5,
      },
      {
        id: "industry",
        type: "single_choice",
        question: "Industry sector",
        required: true,
        options: [
          "IT / Technology",
          "Finance",
          "Consulting",
          "Healthcare",
          "Manufacturing",
          "Other",
        ],
        analyticsKey: "demographics",
        order: 6,
      },
      {
        id: "location",
        type: "single_choice",
        question: "Work location (Delhi NCR)",
        required: true,
        options: ["Delhi", "Gurugram", "Noida", "Faridabad", "Ghaziabad"],
        analyticsKey: "demographics",
        order: 7,
      },
      {
        id: "work_mode",
        type: "single_choice",
        question: "Primary work arrangement",
        required: true,
        options: ["On-site", "Hybrid", "Remote"],
        analyticsKey: "demographics",
        order: 8,
      },
    ],
  },
  {
    id: "health_behaviour",
    title: "Health Related Behaviour",
    description:
      "Please answer based on your regular behaviour and awareness over the past month.",
    icon: "heart",
    estimatedTime: 4,
    themeGradient: "from-purple-500 to-cyan-500",
    questions: likertItems("health_behaviour", "hb", healthBehaviourStems),
  },
  {
    id: "work_engagement",
    title: "Work Engagement",
    description:
      "Think about your typical experiences at work over the past few weeks.",
    icon: "zap",
    estimatedTime: 5,
    themeGradient: "from-blue-500 to-indigo-500",
    questions: likertItems(
      "work_engagement",
      "we",
      workEngagementStems,
      LIKERT_AGREE
    ),
  },
  {
    id: "psychological_wellbeing",
    title: "Psychological Wellbeing",
    description:
      "Reflect on how you have been feeling in general, not only at work.",
    icon: "sparkles",
    estimatedTime: 5,
    themeGradient: "from-violet-500 to-purple-500",
    questions: likertItems(
      "psychological_wellbeing",
      "pw",
      psychologicalWellbeingStems,
      LIKERT_AGREE
    ),
  },
  {
    id: "organizational_support",
    title: "Organizational Support",
    description:
      "Consider your experiences with your organization, leadership, and colleagues.",
    icon: "building",
    estimatedTime: 5,
    themeGradient: "from-cyan-500 to-teal-500",
    questions: likertItems(
      "organizational_support",
      "os",
      organizationalSupportStems,
      LIKERT_AGREE
    ),
  },
  {
    id: "workplace_flourishing",
    title: "Flourishing at Workplace",
    description:
      "These items explore your sense of thriving and fulfillment in your workplace.",
    icon: "sun",
    estimatedTime: 6,
    themeGradient: "from-amber-500 to-orange-500",
    questions: likertItems(
      "workplace_flourishing",
      "wf",
      workplaceFlourishingStems,
      LIKERT_AGREE
    ),
  },
  {
    id: "job_stress",
    title: "Work-Related Stress",
    description:
      "Indicate how often you experience the following in your work life.",
    icon: "activity",
    estimatedTime: 4,
    themeGradient: "from-rose-500 to-pink-500",
    questions: likertItems("job_stress", "js", jobStressStems),
  },
  {
    id: "resilience",
    title: "Resilience",
    description:
      "Think about how you respond to challenges and changes at work.",
    icon: "shield",
    estimatedTime: 4,
    themeGradient: "from-emerald-500 to-green-500",
    questions: likertItems("resilience", "rs", resilienceStems, LIKERT_AGREE),
  },
  {
    id: "social_connectedness",
    title: "Social Connectedness at Work",
    description:
      "Consider your relationships and sense of connection with others at work.",
    icon: "users",
    estimatedTime: 4,
    themeGradient: "from-sky-500 to-blue-500",
    questions: likertItems(
      "social_connectedness",
      "sc",
      socialConnectednessStems,
      LIKERT_AGREE
    ),
  },
  {
    id: "work_life_balance",
    title: "Work–Life Balance",
    description:
      "Reflect on how well you balance professional and personal life.",
    icon: "scale",
    estimatedTime: 4,
    themeGradient: "from-indigo-500 to-violet-500",
    questions: likertItems(
      "work_life_balance",
      "wlb",
      workLifeBalanceStems,
      LIKERT_AGREE
    ),
  },
  {
    id: "optimism",
    title: "Optimism & Outlook",
    description:
      "These items relate to your outlook and expectations regarding work.",
    icon: "sunrise",
    estimatedTime: 3,
    themeGradient: "from-yellow-500 to-amber-500",
    questions: likertItems("optimism", "op", optimismStems, LIKERT_AGREE),
  },
  {
    id: "open_feedback",
    title: "Additional Reflections",
    description:
      "Optional space to share anything else relevant to your workplace experience.",
    icon: "message",
    estimatedTime: 2,
    themeGradient: "from-slate-500 to-slate-600",
    questions: [
      {
        id: "workplace_strengths",
        type: "textarea",
        question:
          "What helps you flourish most at your workplace? (Optional)",
        required: false,
        placeholder: "Share briefly...",
        analyticsKey: "open_feedback",
        order: 1,
      },
      {
        id: "improvement_areas",
        type: "textarea",
        question:
          "What could your organization do better to support employee wellbeing? (Optional)",
        required: false,
        placeholder: "Share briefly...",
        analyticsKey: "open_feedback",
        order: 2,
      },
    ],
  },
];

export const questionnaire: Questionnaire = {
  id: "flourishing-workplace",
  title: "Predictors of Flourishing at Workplace",
  estimatedTime: 25,
  version: "1.0",
  sections,
};
