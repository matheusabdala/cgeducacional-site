"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Search, CheckCircle, AlertCircle, FileCheck, User, Mail, Hash } from 'lucide-react';

interface CertificateResult {
  validacao: string;
  nome_aluno: string;
  nome_curso: string;
}

export const CertificateValidationPage: React.FC = () => {
  const [searchType, setSearchType] = useState<'cpf' | 'id'>('cpf');
  const [searchValue, setSearchValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'empty'>('idle');
  const [results, setResults] = useState<CertificateResult[]>([]);

  const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzWIfOn4-AsVmPxEQMn-YIeRU0VQTi1JIVWd7qkGAV8uyo2P4TTrwgf9_HU51mS-afV7A/exec';

  const applyCpfMask = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (searchType === 'cpf') {
      value = applyCpfMask(value);
    }
    setSearchValue(value);
  };

  const handleSearchTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchType(e.target.value as 'cpf' | 'id');
    setSearchValue('');
    setStatus('idle');
    setResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue) return;

    setStatus('loading');
    setResults([]);

    try {
      const url = `${WEB_APP_URL}?tipo=${searchType}&valorBusca=${encodeURIComponent(searchValue)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (searchType === 'id' && data.validacao) {
        setResults([data]);
        setStatus('success');
      } else if (searchType === 'cpf' && Array.isArray(data) && data.length > 0) {
        setResults(data);
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error("Erro ao buscar certificado:", error);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Hero / Header Section */}
      <section className="bg-cg-900 py-16 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center justify-center p-3 bg-teal-500/20 rounded-full mb-6 ring-1 ring-teal-400/30">
            <ShieldCheck size={32} className="text-teal-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Validação de Certificado</h1>
          <p className="text-cg-100 max-w-2xl mx-auto text-lg">
            Verifique a autenticidade dos certificados emitidos pela CG Educacional.
            Digite o CPF ou o código de verificação encontrado no documento.
          </p>
        </div>
      </section>

      {/* Validation Form Section */}
      <section className="py-12 -mt-10 relative z-20 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="rounded-2xl border border-border bg-card shadow-card p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label htmlFor="tipoBusca" className="block text-sm font-medium text-foreground mb-2">
                    Tipo de Busca
                  </label>
                  <div className="relative">
                     <select
                        id="tipoBusca"
                        value={searchType}
                        onChange={handleSearchTypeChange}
                        className="block w-full pl-3 pr-10 py-4 border border-input rounded-xl bg-card text-foreground text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
                      >
                        <option value="cpf">CPF</option>
                        <option value="id">Código do Certificado</option>
                      </select>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label htmlFor="valorBusca" className="block text-sm font-medium text-foreground mb-2">
                    {searchType === 'cpf' ? 'CPF do Aluno' : 'Código de Autenticidade'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      {searchType === 'cpf' ? (
                        <User className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Hash className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <Input
                      type="text"
                      id="valorBusca"
                      className="h-auto rounded-xl pl-10 pr-3 py-4 text-lg"
                      placeholder={searchType === 'cpf' ? "000.000.000-00" : "Ex: ABC-123-XYZ"}
                      value={searchValue}
                      onChange={handleInputChange}
                      maxLength={searchType === 'cpf' ? 14 : undefined}
                      required
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="glow"
                size="lg"
                className="w-full text-lg"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Verificando...' : 'Validar'}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-2xl">
          
          {status === 'success' && results.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <Badge className="mb-6 w-fit mx-auto border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-600 dark:text-amber-400 animate-pulse">
                  Clique no nome para fazer download do Certificado
               </Badge>

              {results.map((res, index) => (
                <div key={index} className="rounded-2xl border border-emerald-500/30 bg-card shadow-card p-6 flex flex-col items-center text-center hover:shadow-card-hover transition-shadow">
                  <div className="mb-2">
                    <CheckCircle className="text-emerald-500 h-8 w-8 mx-auto mb-2" />
                    <a
                      href={res.validacao}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-bold text-primary hover:text-primary/80 hover:underline flex items-center justify-center gap-2"
                    >
                      Aluno: {res.nome_aluno}
                      <span className="text-xs">🟢</span>
                    </a>
                  </div>
                  <div className="text-muted-foreground font-medium flex items-center gap-2">
                    <span>⏩</span> {res.nome_curso}
                  </div>
                </div>
              ))}
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 shadow-card p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
              <div className="flex flex-col items-center gap-4 text-destructive mb-4">
                <AlertCircle size={48} />
                <h3 className="text-xl font-bold">Certificado Não Encontrado</h3>
              </div>
              <p className="text-muted-foreground">
                Código do certificado ou CPF não encontrado em nossa base de dados.
                <br />Verifique se digitou corretamente.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};