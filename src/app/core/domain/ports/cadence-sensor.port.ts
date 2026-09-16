import { SensorConnectionState } from '../models/sensor-connection';

export type Unsubscribe = () => void;

export type CadenceSensorEvent =
  | {
      readonly kind: 'connection';
      readonly state: SensorConnectionState;
      readonly deviceName: string | null;
      readonly model: string | null;
      readonly manufacturer: string | null;
      readonly error: string | null;
    }
  | { readonly kind: 'cadence'; readonly rpm: number }
  | { readonly kind: 'speed-mode-detected' };

export interface CadenceSensorPort {
  connect(): Promise<void>;
  autoConnect(): Promise<boolean>;
  disconnect(): void;
  subscribe(listener: (event: CadenceSensorEvent) => void): Unsubscribe;
}
