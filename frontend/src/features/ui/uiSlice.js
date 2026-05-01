import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
    name: 'ui',
    initialState: {
        sidebarOpen: true,
        sidebarCollapsed: false,
        activeModal: null,
        toasts: [],
    },
    reducers: {
        toggleSidebar(state) { state.sidebarOpen = !state.sidebarOpen; },
        setSidebarOpen(state, action) { state.sidebarOpen = action.payload; },
        toggleSidebarCollapse(state) { state.sidebarCollapsed = !state.sidebarCollapsed; },
        openModal(state, action) { state.activeModal = action.payload; },
        closeModal(state) { state.activeModal = null; },
        addToast(state, action) {
            state.toasts.push({ id: Date.now(), ...action.payload });
        },
        removeToast(state, action) {
            state.toasts = state.toasts.filter(t => t.id !== action.payload);
        },
    },
});

export const { toggleSidebar, setSidebarOpen, toggleSidebarCollapse, openModal, closeModal, addToast, removeToast } = uiSlice.actions;
export default uiSlice.reducer;
