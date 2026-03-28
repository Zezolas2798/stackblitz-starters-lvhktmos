'use client';

import React from 'react';
import { AnvisaFopLabel, AnvisaLayout } from '@/components/AnvisaFopLabel';
import { AnvisaAlerta } from '@/components/AnvisaTemplates';

const layouts: AnvisaLayout[] = ['HORIZONTAL', 'VERTICAL', 'V1', 'V2', 'V3'];
const nutrients: AnvisaAlerta[] = ['A\u00c7\u00daCAR ADICIONADO', 'GORDURA SATURADA', 'S\u00d3DIO'];

export default function AnvisaDemoPage() {
  return (
    <div style={{ padding: '40px', backgroundColor: '#f5f5f5', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: '30px' }}>ANVISA Nutrition Label Demo (100% SVG Fidelity)</h1>
      
      <section style={{ marginBottom: '50px' }}>
        <h2>1 Ingredient Variations</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          <div>
            <h3>Horizontal</h3>
            <AnvisaFopLabel alertas={['A\u00c7\u00daCAR ADICIONADO']} layout="HORIZONTAL" />
          </div>
          <div>
            <h3>Vertical</h3>
            <AnvisaFopLabel alertas={['GORDURA SATURADA']} layout="VERTICAL" />
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '50px' }}>
        <h2>2 Ingredient Variations</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px' }}>
          {layouts.map(l => (
            <div key={l}>
              <h3>{l}</h3>
              <AnvisaFopLabel alertas={['A\u00c7\u00daCAR ADICIONADO', 'GORDURA SATURADA']} layout={l} />
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: '50px' }}>
        <h2>3 Ingredient Variations</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px' }}>
          {layouts.map(l => (
            <div key={l}>
              <h3>{l}</h3>
              <AnvisaFopLabel alertas={['A\u00c7\u00daCAR ADICIONADO', 'GORDURA SATURADA', 'S\u00d3DIO']} layout={l} />
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: '50px' }}>
        <h2>Scaling Example (2.0x)</h2>
        <AnvisaFopLabel alertas={['A\u00c7\u00daCAR ADICIONADO', 'S\u00d3DIO']} layout="HORIZONTAL" scale={2.0} />
      </section>
    </div>
  );
}
