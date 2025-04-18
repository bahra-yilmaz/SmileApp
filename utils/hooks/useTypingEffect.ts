import { useState, useRef, useEffect } from 'react';

interface TypedTextOptions {
  text: string;
  enabled: boolean;
  typingDelay?: number;
  typingSpeed?: number;
}

export const useTypingEffect = ({ 
  text, 
  enabled,
  typingDelay = 400,
  typingSpeed = 50 
}: TypedTextOptions): string => {
  const [typedText, setTypedText] = useState("");
  const typingInterval = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (enabled) {
      // Reset text first
      setTypedText("");
      
      // Start typing after the specified delay
      const startTypingTimeout = setTimeout(() => {
        let charIndex = 0;
        
        // Clear any existing interval
        if (typingInterval.current) {
          clearInterval(typingInterval.current);
        }
        
        // Set up typing interval
        typingInterval.current = setInterval(() => {
          if (charIndex < text.length) {
            setTypedText(text.substring(0, charIndex + 1));
            charIndex++;
          } else {
            // Clear interval once typing is complete
            if (typingInterval.current) {
              clearInterval(typingInterval.current);
              typingInterval.current = null;
            }
          }
        }, typingSpeed);
      }, typingDelay);
      
      return () => {
        clearTimeout(startTypingTimeout);
        if (typingInterval.current) {
          clearInterval(typingInterval.current);
          typingInterval.current = null;
        }
      };
    }
  }, [enabled, text, typingDelay, typingSpeed]);
  
  return typedText;
};

export default useTypingEffect; 