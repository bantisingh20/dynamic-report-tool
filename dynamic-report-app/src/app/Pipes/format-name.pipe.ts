import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatName',
  standalone: false
})
export class FormatNamePipe implements PipeTransform {

 transform(value: string): string {
    if (!value) return value;
    // Replace underscores with space
    const withoutUnderscores = value.replace(/_/g, ' ');
    // Capitalize each word
    return withoutUnderscores
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

}
