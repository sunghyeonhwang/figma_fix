"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "figma-comment-reader-token";

export function useTokenStorage() {
  const [savedToken, setSavedToken] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load token from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedToken(stored);
      }
    } catch (error) {
      console.error("Error loading token from localStorage:", error);
    }
    setIsLoaded(true);
  }, []);

  // Save token to localStorage
  const saveToken = useCallback((token: string) => {
    try {
      if (token) {
        localStorage.setItem(STORAGE_KEY, token);
        setSavedToken(token);
      }
    } catch (error) {
      console.error("Error saving token to localStorage:", error);
    }
  }, []);

  // Clear token from localStorage
  const clearToken = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setSavedToken("");
    } catch (error) {
      console.error("Error clearing token from localStorage:", error);
    }
  }, []);

  return {
    savedToken,
    isLoaded,
    saveToken,
    clearToken,
  };
}
