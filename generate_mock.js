const fs = require('fs');

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

// Generate random time near a specific hour
function getRandomTime(baseHour) {
    // vary between -30 to +30 minutes
    const varyMinutes = getRandomInt(-30, 30);
    let h = baseHour;
    let m = varyMinutes;
    if (m < 0) {
        h -= 1;
        m = 60 + m;
    }
    const hStr = h.toString().padStart(2, '0');
    const mStr = m.toString().padStart(2, '0');
    return `${hStr}:${mStr}:00`;
}

let sql = `-- 1. Adiciona a constraint UNIQUE (equipamento_id, data, periodo)\n`;
sql += `ALTER TABLE public.controle_temperatura DROP CONSTRAINT IF EXISTS controle_temperatura_equip_data_periodo_key;\n`;
sql += `ALTER TABLE public.controle_temperatura ADD CONSTRAINT controle_temperatura_equip_data_periodo_key UNIQUE (equipamento_id, data, periodo);\n\n`;

sql += `-- 2. Habilita permissão para INSERIR sem depender do cliente logado temporariamente\n`;
sql += `ALTER TABLE public.controle_temperatura DISABLE ROW LEVEL SECURITY;\n\n`;

sql += `-- Limpar dados anteriores de teste se houver\n`;
sql += `DELETE FROM public.controle_temperatura;\n\n`;

sql += `-- 3. Insere dados fictícios (Junho 2026)\n`;
sql += `INSERT INTO public.controle_temperatura (unidade_id, equipamento_id, data, periodo, hora_afericao, temp_equipamento, temp_alimento, status)\nVALUES\n`;

let values = [];
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

    // Generate for June 1 to June 11 (so it shows up in dashboard date filter)
    for (let i = 1; i <= 11; i++) {
        let date = `2026-06-${i.toString().padStart(2, '0')}`;
        
        let tE_manha = getRandomInt(min - 2, max + 2);
        let tA_manha = getRandomInt(min - 2, max + 2);
        
        let tE_tarde = getRandomInt(min - 2, max + 2);
        let tA_tarde = getRandomInt(min - 2, max + 2);
        
        let hora_manha = getRandomTime(8); // Around 08:00
        let hora_tarde = getRandomTime(15); // Around 15:00
        
        values.push(`('${eq.unidade_id}', '${eq.id}', '${date}', 'MANHA', '${hora_manha}', ${tE_manha}, ${tA_manha}, 'LIGADO')`);
        values.push(`('${eq.unidade_id}', '${eq.id}', '${date}', 'TARDE', '${hora_tarde}', ${tE_tarde}, ${tA_tarde}, 'LIGADO')`);
    }
}

sql += values.join(',\n') + ';\n\n';

sql += `-- 4. Reabilita RLS\n`;
sql += `ALTER TABLE public.controle_temperatura ENABLE ROW LEVEL SECURITY;\n`;

fs.writeFileSync('mock_temperaturas.sql', sql);
console.log('SQL generated: mock_temperaturas.sql');
