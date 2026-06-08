// 입력값을 localStorage에 자동 저장/복원하는 훅
import { useState, useEffect } from "react";

export function useLocalDraft<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? (JSON.parse(saved) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch { /* storage full 등 무시 */ }
  }, [key, value]);

  return [value, setValue];
}
