import { useState, useEffect, useRef, useCallback } from 'react';

export function useTimer(quizId, initialSeconds, onExpire) {
    const STORAGE_KEY = `quiz_timer_${quizId}`;

    const [seconds, setSeconds] = useState(() => {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        return saved !== null ? parseInt(saved, 10) : initialSeconds;
    });

    const [isRunning, setIsRunning] = useState(false);
    const onExpireRef = useRef(onExpire);

    useEffect(() => {
        onExpireRef.current = onExpire;
    }, [onExpire]);

    useEffect(() => {
        let interval = null;
        if (isRunning && seconds > 0) {
            interval = setInterval(() => {
                setSeconds((prev) => {
                    const next = prev - 1;
                    sessionStorage.setItem(STORAGE_KEY, next);
                    if (next <= 0) {
                        clearInterval(interval);
                        setIsRunning(false);
                        if (onExpireRef.current) onExpireRef.current();
                        return 0;
                    }
                    return next;
                });
            }, 1000);
        } else if (seconds <= 0 && isRunning) {
            setIsRunning(false);
            if (onExpireRef.current) onExpireRef.current();
        }
        return () => clearInterval(interval);
    }, [isRunning, seconds, STORAGE_KEY]);

    const pause = useCallback(() => setIsRunning(false), []);
    const resume = useCallback(() => setIsRunning(true), []);
    const reset = useCallback(() => {
        setIsRunning(false);
        setSeconds(initialSeconds);
        sessionStorage.removeItem(STORAGE_KEY);
    }, [initialSeconds, STORAGE_KEY]);

    const minutes = Math.floor(seconds / 60);

    return { seconds, minutes, isRunning, pause, resume, reset };
}
