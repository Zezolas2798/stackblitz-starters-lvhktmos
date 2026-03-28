'use client';

import React from 'react';
import styled from 'styled-components';
import * as Templates from './AnvisaTemplates';
import type { AnvisaAlerta } from './AnvisaTemplates';
export type { AnvisaAlerta };

export type AnvisaLayout = 'HORIZONTAL' | 'VERTICAL' | 'V1' | 'V2' | 'V3';

interface AnvisaLabelProps {
  alertas: AnvisaAlerta[];
  layout?: AnvisaLayout;
  className?: string;
  scale?: number;
}

const Wrapper = styled.div<{ $scale: number }>`
  display: inline-block;
  transform: scale(${props => props.$scale});
  transform-origin: top left;
  line-height: 0;
`;

export const AnvisaFopLabel: React.FC<AnvisaLabelProps> = ({
  alertas,
  layout = 'HORIZONTAL',
  className,
  scale = 1
}) => {
  if (!alertas || alertas.length === 0) return null;

  const safeAlertas = alertas.slice(0, 3);
  const count = safeAlertas.length;
  
  let Template: React.FC<Templates.TemplateProps> = Templates.Template1H;

  if (count === 1) {
    Template = (layout === 'VERTICAL') ? Templates.Template1V : Templates.Template1H;
  } else if (count === 2) {
    switch (layout) {
      case 'HORIZONTAL': Template = Templates.Template2H; break;
      case 'VERTICAL': Template = Templates.Template2V; break;
      case 'V1': Template = Templates.Template2v1; break;
      case 'V2': Template = Templates.Template2v2; break;
      case 'V3': Template = Templates.Template2v3; break;
      default: Template = Templates.Template2H;
    }
  } else if (count === 3) {
    switch (layout) {
      case 'HORIZONTAL': Template = Templates.Template3H; break;
      case 'VERTICAL': Template = Templates.Template3V; break;
      case 'V1': Template = Templates.Template3v1; break;
      case 'V2': Template = Templates.Template3v2; break;
      case 'V3': Template = Templates.Template3v3; break;
      default: Template = Templates.Template3H;
    }
  }

  return (
    <Wrapper $scale={scale} className={className}>
      <Template nutrients={safeAlertas} />
    </Wrapper>
  );
};
