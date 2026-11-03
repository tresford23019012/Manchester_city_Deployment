
import { createContext, useContext, useRef } from "react";
import { Animated } from "react-native";

const ScrollContext = createContext<Animated.Value | null>(null);

export function ScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const scrollY = useRef(new Animated.Value(0)).current;

  return (
    <ScrollContext.Provider value={scrollY}>
      {children}
    </ScrollContext.Provider>
  );
}

export function useScrollAnimation() {
  const context = useContext(ScrollContext);

  if (!context) {
    throw new Error("useScrollAnimation must be used inside ScrollProvider");
  }

  return context;
}
