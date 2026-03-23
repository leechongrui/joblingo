export type CardStatus = "got_it" | "need_practice" | "unseen";

export interface InterviewKeyword {
  zh: string;
  en: string;
}

export interface InterviewCard {
  id: string;
  order: number;
  questionZh: string;
  meaningEn: string;
  keywords: InterviewKeyword[];
  technicalTerms: InterviewKeyword[];
  answerPlanEn: string[];
  answerPlanZh: string[];
  answerFrameworkZh: string;
  status: CardStatus;
}

export interface InterviewDeck {
  id: string;
  title: string;
  companyName: string;
  roleTitle: string;
  cardCount: number;
  createdAt: string;
  jobDescriptionTerms: InterviewKeyword[];
  resumeTerms: InterviewKeyword[];
  cards: InterviewCard[];
}

export interface GenerateDeckPayload {
  companyName: string;
  roleTitle: string;
  jobDescription: string;
  resume?: string;
  skipCache?: boolean;
}
