import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    currentQuiz: null,
    currentAttempt: null, // { quizId, answers: {}, flagged: [], startedAt, timeRemaining }
    results: null,
};

const quizSlice = createSlice({
    name: 'quiz',
    initialState,
    reducers: {
        startAttempt: (state, action) => {
            const quiz = action.payload;
            state.currentQuiz = quiz;
            state.currentAttempt = {
                quizId: quiz.id,
                answers: {},
                flagged: [],
                startedAt: Date.now(),
                timeRemaining: quiz.timeLimit * 60,
            };
            state.results = null;
        },
        setAnswer: (state, action) => {
            const { questionId, answer } = action.payload;
            if (state.currentAttempt) {
                state.currentAttempt.answers[questionId] = answer;
            }
        },
        toggleFlag: (state, action) => {
            const questionId = action.payload;
            if (state.currentAttempt) {
                const index = state.currentAttempt.flagged.indexOf(questionId);
                if (index === -1) {
                    state.currentAttempt.flagged.push(questionId);
                } else {
                    state.currentAttempt.flagged.splice(index, 1);
                }
            }
        },
        submitAttempt: (state, action) => {
            state.results = action.payload;
            state.currentAttempt = null;
        },
        clearAttempt: (state) => {
            state.currentQuiz = null;
            state.currentAttempt = null;
            state.results = null;
        }
    }
});

export const { startAttempt, setAnswer, toggleFlag, submitAttempt, clearAttempt } = quizSlice.actions;
export default quizSlice.reducer;
