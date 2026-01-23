import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Livro, CreateLivroDto, UpdateLivroDto } from '../models/livro.model';

@Injectable({
  providedIn: 'root'
})
export class LivroService {
  private apiUrl = `${environment.apiUrl}/livros`;

  constructor(private http: HttpClient) {}

  getAll(disponivel?: boolean): Observable<Livro[]> {
    if (disponivel !== undefined) {
      return this.http.get<Livro[]>(this.apiUrl, { 
        params: { disponivel: disponivel.toString() } 
      });
    }
    return this.http.get<Livro[]>(this.apiUrl);
  }

  getById(id: string): Observable<Livro> {
    return this.http.get<Livro>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateLivroDto): Observable<Livro> {
    return this.http.post<Livro>(this.apiUrl, dto);
  }

  update(id: string, dto: UpdateLivroDto): Observable<Livro> {
    return this.http.patch<Livro>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
