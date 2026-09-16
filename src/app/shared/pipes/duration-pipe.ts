import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duration',
})
export class DurationPipe implements PipeTransform {
  transform(totalSeconds: number | null): string {
    if (totalSeconds === null || !Number.isFinite(totalSeconds) || totalSeconds < 0) {
      return '--:--';
    }

    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600);

    if (hours > 0) {
      return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  }
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}
