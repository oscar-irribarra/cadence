import { InjectionToken } from '@angular/core';
import { CadenceSensorPort } from '../../domain/ports/cadence-sensor.port';

export const CADENCE_SENSOR = new InjectionToken<CadenceSensorPort>('CadenceSensor');
