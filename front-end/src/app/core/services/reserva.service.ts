import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reserva, CreateReservaDto } from '../models/reserva.model';

@Injectable({
  providedIn: 'root'
})
export class ReservaService {
  private apiUrl = `${environment.apiUrl}/reservas`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(this.apiUrl);
  }

  getEmAtraso(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.apiUrl}/em-atraso`);
  }

  getByCliente(clienteId: string): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.apiUrl}/cliente/${clienteId}`);
  }

  getById(id: string): Observable<Reserva> {
    return this.http.get<Reserva>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateReservaDto): Observable<Reserva> {
    return this.http.post<Reserva>(this.apiUrl, dto);
  }

  devolver(id: string): Observable<Reserva> {
    return this.http.patch<Reserva>(`${this.apiUrl}/${id}/devolver`, {});
  }

  calcularMulta(dataPrevista: Date, dataDevolucao: Date): { multa: number; dias: number } {
    const diffMs = dataDevolucao.getTime() - dataPrevista.getTime();
    const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (dias <= 0) {
      return { multa: 0, dias: 0 };
    }
    
    const multa = 10 + (10 * 0.05 * dias);
    return { multa: parseFloat(multa.toFixed(2)), dias };
  }
}
