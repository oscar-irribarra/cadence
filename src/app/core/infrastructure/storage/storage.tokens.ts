import { InjectionToken } from '@angular/core';
import { RideRepository } from '../../domain/ports/ride-repository.port';

export const RIDE_REPOSITORY = new InjectionToken<RideRepository>('RideRepository');
