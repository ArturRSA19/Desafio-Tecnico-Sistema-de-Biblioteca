import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[appTelefoneMask]',
  standalone: true
})
export class TelefoneMaskDirective {
  @HostListener('input', ['$event'])
  onInput(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    // Formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (value.length <= 10) {
      // Telefone fixo: (XX) XXXX-XXXX
      value = value.replace(/(\d{2})(\d)/, '($1) $2');
      value = value.replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      // Celular: (XX) XXXXX-XXXX
      value = value.replace(/(\d{2})(\d)/, '($1) $2');
      value = value.replace(/(\d{5})(\d)/, '$1-$2');
    }
    
    event.target.value = value;
  }
}
