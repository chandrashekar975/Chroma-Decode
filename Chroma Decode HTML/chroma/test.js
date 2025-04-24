import { createClient } from '@supabase/supabase-js'
const SUPABASE_URL = 'https://fkjacsfcxwtjhyofhnoo.supabase.co'; // <<<< REPLACE THIS
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZramFjc2ZjeHd0amh5b2Zobm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNjYyMDgsImV4cCI6MjA2MDY0MjIwOH0.tHNaoDI5QMaeMXqcjhHW9npTq_KtLerfo9OjFv-S9Fs'; // <<<< REPLACE THIS

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const { data, error } = await supabase.auth.signUp({
    email: 'jopej80896@lushosa.com',
    password: '234234234',
});