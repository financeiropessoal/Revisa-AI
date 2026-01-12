import { Deck, Flashcard, DifficultyLevel } from '../types';

const STORAGE_KEY = 'leiseca_decks_v1';

export const getDecks = (): Deck[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load decks", error);
    return [];
  }
};

export const saveDecks = (decks: Deck[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
  } catch (error) {
    console.error("Failed to save decks", error);
  }
};

export const createDeck = (subject: string, title: string, description: string): Deck => {
  return {
    id: crypto.randomUUID(),
    subject: subject || "Geral",
    title,
    description,
    cards: [],
    createdAt: Date.now()
  };
};

export const createFlashcard = (
  front: string, 
  back: string, 
  legalReference?: string, 
  legalText?: string,
  options?: string[],
  correctAnswer?: string,
  difficulty?: DifficultyLevel
): Flashcard => {
  return {
    id: crypto.randomUUID(),
    front,
    back,
    legalReference,
    legalText,
    options,
    correctAnswer,
    difficulty: difficulty || 'medium',
    studied: false,
    studyHistory: [],
    // Initialize SRS defaults
    nextReviewDate: 0, // 0 means new/due immediately
    interval: 0,
    easeFactor: 2.5,
    createdAt: Date.now()
  };
};