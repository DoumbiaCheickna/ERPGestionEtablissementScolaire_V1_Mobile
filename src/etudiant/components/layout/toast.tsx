import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

type ToastProps = {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number; 
};

const Toast: React.FC<ToastProps> = ({ message, type, duration = 3000 }) => {
  const [visible, setVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Fade out after duration
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Use setTimeout to defer state update to next tick
        setTimeout(() => {
          setVisible(false);
        }, 0);
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [fadeAnim, duration]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.toast, styles[type as never], { opacity: fadeAnim }]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    maxWidth: "90%",
    zIndex: 100,
  },
  text: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
  },
  success: { backgroundColor: "#4CAF50" },
  error: { backgroundColor: "#F44336" },
  info: { backgroundColor: "#2196F3" },
});

export default Toast;