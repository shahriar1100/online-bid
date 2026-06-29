"use client"
import React, { createContext, useReducer, useContext } from "react";

const selectedCountry = typeof window !== "undefined" ? localStorage.getItem("selectedCountry") : null;
const selectedState = typeof window !== "undefined" ? localStorage.getItem("selectedState") : null;
const selectedCity = typeof window !== "undefined" ? localStorage.getItem("selectedCity") : null;

type StateType = {
  selectedCountry: string;
  selectedState: string;
  selectedCity: string | null;
};

type ActionType =
  | { type: "SET_COUNTRY"; payload: string }
  | { type: "SET_STATE"; payload: string }
  | { type: "SET_CITY"; payload: string };

const initialState: StateType = {
  selectedCountry: selectedCountry || "",
  selectedState: selectedState || "",
  selectedCity: selectedCity || null
};

const appReducer = (state: StateType, action: ActionType): StateType => {
  switch (action.type) {
    case "SET_COUNTRY":
      return {
        ...state,
        selectedCountry: action.payload,
        selectedState: "",
        selectedCity: null
      };
    case "SET_STATE":
      return {
        ...state,
        selectedState: action.payload,
        selectedCity: null
      };
    case "SET_CITY":
      return {
        ...state,
        selectedCity: action.payload
      };
    default:
      return state;
  }
};

export const AppContext = createContext<{ state: StateType; dispatch: React.Dispatch<ActionType> } | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
}