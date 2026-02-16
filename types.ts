
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface GeneratedCardData {
  front: string;
  back: string;
  options: string[];
  correctAnswer: string;
  legalText: string;
  legalReference: string;
  difficulty: DifficultyLevel;
}

export interface Flashcard {
  id: string;
  front: string; // The question
  back: string;  // The explanation
  options?: string[]; // Multiple choice options
  correctAnswer?: string; // The correct option text
  legalText?: string; // The literal law text with highlights
  legalReference?: string; // e.g., "Art. 155, CP"
  difficulty?: DifficultyLevel; // New field
  
  // SRS Fields
  studied?: boolean; // Legacy/Simple tracking
  studyHistory?: number[]; // Array of timestamps
  nextReviewDate?: number; // Timestamp for next review
  interval?: number; // Current interval in days
  easeFactor?: number; // Multiplier for interval (default 2.5)
  
  createdAt: number;
}

export interface Deck {
  id: string;
  subject: string; // e.g. "Direito Penal"
  title: string; // e.g. "Crimes contra a Vida" (The specific topic)
  description: string;
  cards: Flashcard[];
  createdAt: number;
  lastStudied?: number;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  DECK_DETAILS = 'DECK_DETAILS',
  STUDY_MODE = 'STUDY_MODE',
  STATS = 'STATS'
}

export interface AIGenerationParams {
  subject: string;
  topic: string;
  quantity: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
}