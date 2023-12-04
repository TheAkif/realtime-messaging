import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    isAuthenticated: false,
    user: null,
    loading: false,
    registered: false,   
}

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        // increment: (state) => {
        //     state.value += 1;
        // },
        // decrement: (state) => {
        //     state.value -= 1;
        // },
        // incrementByAmount: (state, action) => {
        //     state.value += action.payload;
        // },
        // login: (state, action) => {
        //     state.isAuthenticated = true;
        // }
        resetRegistered: state => {
            state.registered = false;
        }
    }
})

export const { increment, decrement, incrementByAmount } =userSlice.actions
export default userSlice.reducer 