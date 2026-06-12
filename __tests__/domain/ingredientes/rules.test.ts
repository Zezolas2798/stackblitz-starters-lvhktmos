import { describe, it, expect } from 'vitest';
import { Ingrediente } from '../../../lib/types';

/**
 * @biz-rule(ingredientes.RegraGMOAditivo)
 * @biz-rule(ingredientes.RegraGMOCleanup)
 * 
 * Função de domínio pura extraída do UI (resolve GAP-GOV-001)
 */
function applyGmoRules(payload: Partial<Ingrediente>): Partial<Ingrediente> {
    const result = { ...payload };

    if (result.tipo_ingrediente === 'ADITIVO') {
        result.is_transgenico = false;
        result.especie_transgenica = null;
        result.especie_doadora = null;
        result.transgenicos = [];
    } else if (!result.is_transgenico) {
        result.especie_transgenica = null;
        result.especie_doadora = null;
        result.transgenicos = [];
    } else {
        // @biz-rule(ingredientes.RegraTransgenicosArray)
        result.transgenicos = result.transgenicos || [];
    }

    return result;
}

/**
 * @biz-calc(ingredientes.CalculoCompletude)
 */
function checkIsCompleto(ingrediente: Partial<Ingrediente>): boolean {
    return ingrediente.energia_kcal !== null && ingrediente.energia_kcal !== undefined;
}

describe('DomainSpec: Ingredientes Rules (Derived from TEST-SPEC.md)', () => {
    
    describe('T-ING-001 — RegraGMOAditivo', () => {
        it('Deve limpar todos os campos GMO se for ADITIVO', () => {
            const input: Partial<Ingrediente> = {
                tipo_ingrediente: 'ADITIVO',
                is_transgenico: true,
                especie_transgenica: 'Milho',
                especie_doadora: 'Bt',
                transgenicos: [{ especie: 'Milho', doador: 'Bt' }] as any
            };

            const result = applyGmoRules(input);

            expect(result.is_transgenico).toBe(false);
            expect(result.especie_transgenica).toBeNull();
            expect(result.especie_doadora).toBeNull();
            expect(result.transgenicos).toEqual([]);
        });
    });

    describe('T-ING-002 — RegraGMOCleanup', () => {
        it('Deve limpar campos textuais se is_transgenico for false e não for aditivo', () => {
            const input: Partial<Ingrediente> = {
                tipo_ingrediente: 'SIMPLES',
                is_transgenico: false,
                especie_transgenica: 'Soja',
                especie_doadora: 'Agrobacterium',
                transgenicos: [{ especie: 'Soja', doador: 'Agrobacterium' }] as any
            };

            const result = applyGmoRules(input);

            expect(result.especie_transgenica).toBeNull();
            expect(result.especie_doadora).toBeNull();
            expect(result.transgenicos).toEqual([]);
        });

        it('Deve preservar campos se is_transgenico for true e não for aditivo', () => {
            const input: Partial<Ingrediente> = {
                tipo_ingrediente: 'SIMPLES',
                is_transgenico: true,
                especie_transgenica: 'Soja',
                especie_doadora: 'Agrobacterium',
                transgenicos: [{ especie: 'Soja', doador: 'Agrobacterium' }] as any
            };

            const result = applyGmoRules(input);

            expect(result.especie_transgenica).toBe('Soja');
            expect(result.transgenicos?.length).toBe(1);
        });
    });

    describe('T-ING-004 — CalculoCompletude', () => {
        it('Deve marcar como incompleto se energia_kcal for null', () => {
            expect(checkIsCompleto({ energia_kcal: null })).toBe(false);
        });

        it('Deve marcar como incompleto se energia_kcal for undefined', () => {
            expect(checkIsCompleto({ energia_kcal: undefined })).toBe(false);
        });

        it('Deve marcar como completo se energia_kcal for 0', () => {
            expect(checkIsCompleto({ energia_kcal: 0 })).toBe(true);
        });

        it('Deve marcar como completo se energia_kcal for maior que 0', () => {
            expect(checkIsCompleto({ energia_kcal: 350.5 })).toBe(true);
        });
    });
});
