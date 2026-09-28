import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@supabase/supabase-js';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

type Prediction = 'W' | 'L';

const STORAGE_KEY = 'wolves-predictions-2026-27';
const SEASON = '2026-27';

export function usePredictorSummary() {
  const [user, setUser] = useState<User | null>(null);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);

      let predictions: Record<number, Prediction> = {};

      if (user) {
        const { data, error } = await supabase
          .from('predictor_predictions')
          .select('predictions')
          .eq('user_id', user.id)
          .eq('season', SEASON)
          .maybeSingle();

        if (error) {
          console.log(
            'Could not load Predictor summary:',
            error
          );
        } else if (data?.predictions) {
          predictions =
            data.predictions as Record<number, Prediction>;
        }
      } else {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);

        if (saved) {
          predictions = JSON.parse(saved);
        }
      }

      const predictionValues = Object.values(predictions);

      setWins(
        predictionValues.filter(
          (prediction) => prediction === 'W'
        ).length
      );

      setLosses(
        predictionValues.filter(
          (prediction) => prediction === 'L'
        ).length
      );
    } catch (error) {
      console.log(
        'Could not calculate Predictor summary:',
        error
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [loadSummary])
  );

  const predicted = wins + losses;
  const remaining = Math.max(0, 82 - predicted);

  return {
    wins,
    losses,
    predicted,
    remaining,
    loading,
  };
}