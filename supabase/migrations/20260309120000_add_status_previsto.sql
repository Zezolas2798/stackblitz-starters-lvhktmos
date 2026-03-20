-- Migration: Adding PREVISTO status to status_lote_estoque
-- Objective: Allow saving NFs before physical arrival

ALTER TYPE public.status_lote_estoque ADD VALUE IF NOT EXISTS 'PREVISTO';
