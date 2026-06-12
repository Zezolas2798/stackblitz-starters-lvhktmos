const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const equipamentos = [
  {"id":"a05528e0-97c8-46d8-956d-dbadbc90920e","unidade_id":"77ae5ae9-602d-4cbf-b708-9304616a33d4","tipo_equipamento":"CAMARA_FRIA_RESFRIADOS","temp_ideal_min":"4","temp_ideal_max":"9"},
  {"id":"a74ff3d0-4d5c-4f1b-941d-c93a3c1d19cc","unidade_id":"77ae5ae9-602d-4cbf-b708-9304616a33d4","tipo_equipamento":"CAMARA_FRIA_RESFRIADOS","temp_ideal_min":"4","temp_ideal_max":"8"},
  {"id":"e9aea7c3-af6a-4185-b9fb-2c22848762b9","unidade_id":"77ae5ae9-602d-4cbf-b708-9304616a33d4","tipo_equipamento":null,"temp_ideal_min":null,"temp_ideal_max":null},
  {"id":"fe048eb1-9fbf-48b6-aff0-44b4b0001c5a","unidade_id":"77ae5ae9-602d-4cbf-b708-9304616a33d4","tipo_equipamento":null,"temp_ideal_min":null,"temp_ideal_max":null},
  {"id":"500f80c7-d4a3-44ef-a16c-9ec5851ebec3","unidade_id":"77ae5ae9-602d-4cbf-b708-9304616a33d4","tipo_equipamento":null,"temp_ideal_min":"4","temp_ideal_max":"9"},
  {"id":"a7c6534f-e468-48d5-ae10-15906b3818ea","unidade_id":"77ae5ae9-602d-4cbf-b708-9304616a33d4","tipo_equipamento":"CAMARA_FRIA_CONGELADOS","temp_ideal_min":null,"temp_ideal_max":null},
  {"id":"0316f3ae-02d7-4962-9cbd-2244fdfe0290","unidade_id":"77ae5ae9-602d-4cbf-b708-9304616a33d4","tipo_equipamento":"CAMARA_FRIA_CONGELADOS","temp_ideal_min":"-18","temp_ideal_max":"-15"},
  {"id":"b9c20e02-c479-4a30-82c1-53b5b946c0a1","unidade_id":"77ae5ae9-602d-4cbf-b708-9304616a33d4","tipo_equipamento":"PASS_THROUGH_QUENTE","temp_ideal_min":"80","temp_ideal_max":"125"}
];

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function run() {
    let mockData = [];

    for (const eq of equipamentos) {
        let min = parseInt(eq.temp_ideal_min);
        let max = parseInt(eq.temp_ideal_max);
        
        if (isNaN(min) || isNaN(max)) {
            if (eq.tipo_equipamento === 'CAMARA_FRIA_CONGELADOS') {
                min = -22; max = -15;
            } else if (eq.tipo_equipamento === 'PASS_THROUGH_QUENTE') {
                min = 60; max = 80;
            } else {
                min = 2; max = 10;
            }
        }

        for (let i = 1; i <= 31; i++) {
            let date = `2026-05-${i.toString().padStart(2, '0')}`;
            
            mockData.push({
                unidade_id: eq.unidade_id,
                equipamento_id: eq.id,
                data: date,
                periodo: 'MANHA',
                hora_afericao: '08:00:00',
                temp_equipamento: getRandomInt(min - 2, max + 2),
                temp_alimento: getRandomInt(min - 2, max + 2),
                status: 'LIGADO',
                alimento: 'Produto Teste'
            });

            mockData.push({
                unidade_id: eq.unidade_id,
                equipamento_id: eq.id,
                data: date,
                periodo: 'TARDE',
                hora_afericao: '15:00:00',
                temp_equipamento: getRandomInt(min - 2, max + 2),
                temp_alimento: getRandomInt(min - 2, max + 2),
                status: 'LIGADO',
                alimento: 'Produto Teste'
            });
        }
    }

    console.log(`Inserindo ${mockData.length} registros...`);
    const { error } = await supabase.from('controle_temperatura').insert(mockData);
    if (error) {
        console.error('Erro ao inserir:', error);
    } else {
        console.log('Inseridos com sucesso!');
    }
}

run();
