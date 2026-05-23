export interface Question {
  id: number;
  originalNum: number;
  question: string;
  options: {
    letter: string;
    text: string;
    is_correct?: boolean;
  }[];
  answer: string;
  hasImage: boolean;
  page: number;
  imagePath?: string;
}

export interface DailyHistory {
  date: string;
  correctCount: number;
  totalCount: number;
}

export interface UserProgressState {
  completedIds: number[];
  starredIds: number[];
  incorrectIds: number[];
  boxes: {
    1: number[]; // Daily
    2: number[]; // Every 2 days
    3: number[]; // Every 4 days
    4: number[]; // Every 7 days
    5: number[]; // Mastered
  };
  lastStudyDate: string | null;
  streakCount: number;
  dailyTargetCount: number; // defaults to 29
  history: DailyHistory[];
}

const LOCAL_STORAGE_KEY = "amategeko_mastery_state";

export function getInitialState(questions: Question[]): UserProgressState {
  const allIds = questions.map((q) => q.id);
  return {
    completedIds: [],
    starredIds: [],
    incorrectIds: [],
    boxes: {
      1: allIds,
      2: [],
      3: [],
      4: [],
      5: [],
    },
    lastStudyDate: null,
    streakCount: 0,
    dailyTargetCount: 29,
    history: [],
  };
}

export function loadProgressState(questions: Question[]): UserProgressState {
  if (typeof window === "undefined") {
    return getInitialState(questions);
  }
  
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) {
      const initial = getInitialState(questions);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    
    const parsed = JSON.parse(saved) as UserProgressState;
    
    // Safety check: ensure all questions are accounted for (e.g. if dataset changes or for recovery)
    const allQuestionIds = questions.map((q) => q.id);
    const trackedIds = new Set<number>();
    
    // Accumulate all IDs currently inside the Leitner boxes
    Object.values(parsed.boxes).forEach((boxArr) => {
      if (Array.isArray(boxArr)) {
        boxArr.forEach((id) => trackedIds.add(id));
      }
    });
    
    // Find any untracked question IDs and push them to Box 1
    const untrackedIds = allQuestionIds.filter((id) => !trackedIds.has(id));
    if (untrackedIds.length > 0) {
      parsed.boxes[1] = [...(parsed.boxes[1] || []), ...untrackedIds];
    }
    
    return parsed;
  } catch (e) {
    console.error("Error loading progress state:", e);
    return getInitialState(questions);
  }
}

export function saveProgressState(state: UserProgressState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Error saving progress state:", e);
  }
}

export function submitAnswer(
  questionId: number,
  isCorrect: boolean,
  state: UserProgressState
): UserProgressState {
  // Deep clone state to avoid mutation side-effects
  const newState = JSON.parse(JSON.stringify(state)) as UserProgressState;
  
  // 1. Locate current box of the question
  let currentBox: 1 | 2 | 3 | 4 | 5 = 1;
  let found = false;
  
  for (const boxNum of [1, 2, 3, 4, 5] as const) {
    const idx = newState.boxes[boxNum].indexOf(questionId);
    if (idx !== -1) {
      newState.boxes[boxNum].splice(idx, 1);
      currentBox = boxNum;
      found = true;
      break;
    }
  }
  
  // If not found in any box (safety catch), default to Box 1
  if (!found) {
    currentBox = 1;
  }
  
  // 2. Leitner Box Promotion/Demotion logic
  if (isCorrect) {
    // Promote: N -> N+1 (up to Box 5)
    const nextBox = Math.min(5, currentBox + 1) as 1 | 2 | 3 | 4 | 5;
    newState.boxes[nextBox].push(questionId);
    
    // Remove from incorrect list if corrected
    const incIdx = newState.incorrectIds.indexOf(questionId);
    if (incIdx !== -1) {
      newState.incorrectIds.splice(incIdx, 1);
    }
    
    // Add to completed list if not already there
    if (!newState.completedIds.includes(questionId)) {
      newState.completedIds.push(questionId);
    }
  } else {
    // Demote: Move completely back to Box 1 (Active Recall enforcement!)
    newState.boxes[1].push(questionId);
    
    // Add to incorrect list
    if (!newState.incorrectIds.includes(questionId)) {
      newState.incorrectIds.push(questionId);
    }
  }
  
  // 3. Track History & Streaks
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  
  // Update today's study history count
  let todayHistory = newState.history.find((h) => h.date === today);
  if (!todayHistory) {
    todayHistory = { date: today, correctCount: 0, totalCount: 0 };
    newState.history.push(todayHistory);
  }
  
  todayHistory.totalCount += 1;
  if (isCorrect) {
    todayHistory.correctCount += 1;
  }
  
  // Streak updates: trigger when they complete today's first question
  // and handle consecutive days
  if (newState.lastStudyDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    
    if (newState.lastStudyDate === yesterdayStr) {
      // Studied yesterday, increment streak
      newState.streakCount += 1;
    } else if (newState.streakCount === 0 || !newState.lastStudyDate) {
      // First ever study or reset streak
      newState.streakCount = 1;
    }
    newState.lastStudyDate = today;
  }
  
  saveProgressState(newState);
  return newState;
}

export function toggleStarred(questionId: number, state: UserProgressState): UserProgressState {
  const newState = JSON.parse(JSON.stringify(state)) as UserProgressState;
  const idx = newState.starredIds.indexOf(questionId);
  
  if (idx !== -1) {
    newState.starredIds.splice(idx, 1);
  } else {
    newState.starredIds.push(questionId);
  }
  
  saveProgressState(newState);
  return newState;
}

export function resetProgress(questions: Question[]): UserProgressState {
  const freshState = getInitialState(questions);
  saveProgressState(freshState);
  return freshState;
}

/**
 * Get active review queue for a particular box and day.
 * - Box 1: daily (always active if has items)
 * - Box 2: review every 2 days
 * - Box 3: review every 4 days
 * - Box 4: review every 7 days
 * - Box 5: mastered (typically not shown unless review-only)
 */
export function getActiveQueue(state: UserProgressState, dayIndex: number = 0): number[] {
  const activeIds: number[] = [...state.boxes[1]]; // Box 1 is ALWAYS reviewed daily
  
  if (dayIndex % 2 === 0) {
    activeIds.push(...state.boxes[2]);
  }
  if (dayIndex % 4 === 0) {
    activeIds.push(...state.boxes[3]);
  }
  if (dayIndex % 7 === 0) {
    activeIds.push(...state.boxes[4]);
  }
  
  return activeIds;
}
