import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'telefoneFormat',
  standalone: true
})
export class TelefoneFormatPipe implements PipeTransform {
  transform(telefone: string | undefined): string {
    if (!telefone) return '';
    const cleaned = telefone.replace(/\D/g, '');
    
    // Formato com DDD: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return telefone;
  }
}
