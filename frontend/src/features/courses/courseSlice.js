import { createSlice } from '@reduxjs/toolkit';

const courseSlice = createSlice({
    name: 'courses',
    initialState: {
        list: [],
        current: null,
        loading: false,
        error: null,
        filters: { category: '', difficulty: '', search: '' },
    },
    reducers: {
        setLoading(state, action) { state.loading = action.payload; },
        setCourses(state, action) { state.list = action.payload; },
        setCurrentCourse(state, action) { state.current = action.payload; },
        setError(state, action) { state.error = action.payload; },
        setFilters(state, action) { state.filters = { ...state.filters, ...action.payload }; },
        clearFilters(state) { state.filters = { category: '', difficulty: '', search: '' }; },
    },
});

export const { setLoading, setCourses, setCurrentCourse, setError, setFilters, clearFilters } = courseSlice.actions;
export default courseSlice.reducer;
