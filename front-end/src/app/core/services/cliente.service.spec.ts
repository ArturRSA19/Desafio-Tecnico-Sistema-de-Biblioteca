import { describe, expect, it, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ClienteService } from './cliente.service';
import { Cliente, CreateClienteDto, UpdateClienteDto } from '../models/cliente.model';
import { environment } from '../../../environments/environment';

describe('ClienteService', () => {
  let service: ClienteService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/clientes`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ClienteService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ClienteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('deve buscar todos os clientes', () => {
    const mockClientes: Cliente[] = [
      { id: '1', nome: 'João Silva', cpf: '12345678909' }
    ];

    service.getAll().subscribe(clientes => {
      expect(clientes).toEqual(mockClientes);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockClientes);
  });

  it('deve criar um novo cliente', () => {
    const createDto: CreateClienteDto = {
      nome: 'João Silva',
      cpf: '12345678909'
    };

    const mockResponse: Cliente = { id: '1', ...createDto };

    service.create(createDto).subscribe(cliente => {
      expect(cliente).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createDto);
    req.flush(mockResponse);
  });

  it('deve atualizar um cliente existente', () => {
    const clienteId = '1';
    const updateDto: UpdateClienteDto = { nome: 'João Silva Atualizado' };
    const mockResponse: Cliente = {
      id: clienteId,
      nome: 'João Silva Atualizado',
      cpf: '12345678909'
    };

    service.update(clienteId, updateDto).subscribe(cliente => {
      expect(cliente).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/${clienteId}`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(updateDto);
    req.flush(mockResponse);
  });

  it('deve deletar um cliente', () => {
    const clienteId = '1';

    service.delete(clienteId).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/${clienteId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
