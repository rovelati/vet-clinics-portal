import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rydgvljnfeeftihcvsiw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZGd2bGpuZmVlZnRpaGN2c2l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NDE0NzYsImV4cCI6MjA3MTAxNzQ3Nn0.7UyGo_auhjhl5bMZpCzPOhGFeycBSd1YYg6X3Zprqiw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);