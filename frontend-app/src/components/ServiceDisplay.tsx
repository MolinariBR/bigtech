import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { MapPin, Phone, Mail, Car, Building, CreditCard, User } from 'lucide-react';

interface BigTechResponse {
  success: boolean;
  service: string;
  chaveConsulta: string;
  dataHora: string;
  parametros: Record<string, any>;
  dados: any;
}

interface ServiceDisplayProps {
  data: BigTechResponse;
}

const ServiceDisplay: React.FC<ServiceDisplayProps> = ({ data }) => {
  if (!data.success) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Erro na consulta: {data.dados?.error || 'Erro desconhecido'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderByService = () => {
    // Verificação defensiva para o service
    if (!data.service) {
      return <GenericDisplay data={data} />;
    }

    switch (data.service) {
      case '1539-bvs-basica-pf':
        return <BVSBasicaPF data={data} />;
      case '11-bvs-basica-pj':
        return <BVSBasicaPJ data={data} />;
      case '1003-scr-premium-integracoes':
        return <SCRPremium data={data} />;
      case '320-contatos-por-cep':
        return <ContatosPorCEP data={data} />;
      case '411-crlv-ro':
        return <CRLVRO data={data} />;
      default:
        return <GenericDisplay data={data} />;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Header com informações da consulta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Consulta BigTech - {getServiceName(data.service)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Chave da Consulta:</span>
              <p className="font-mono text-xs">{data.chaveConsulta}</p>
            </div>
            <div>
              <span className="font-medium">Data/Hora:</span>
              <p>{new Date(data.dataHora).toLocaleString('pt-BR')}</p>
            </div>
            <div>
              <span className="font-medium">Status:</span>
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Sucesso</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo específico do serviço */}
      {renderByService()}
    </div>
  );
};

// Componente para BVS Básica PF
const BVSBasicaPF: React.FC<{ data: BigTechResponse }> = ({ data }) => {
  // Verificações defensivas para evitar erros de renderização
  if (!data || !data.dados) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-muted-foreground">Dados da consulta não disponíveis.</p>
        </CardContent>
      </Card>
    );
  }

  const pessoa = data.dados.credCadastral?.PESSOA_FISICA;
  const enderecos = data.dados.credCadastral?.ENDERECOS || [];
  const telefones = data.dados.credCadastral?.TELEFONES || [];
  const emails = data.dados.credCadastral?.EMAILS || [];

  return (
    <div className="space-y-4">
      {/* Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <p className="text-lg">{pessoa?.NOME || 'Não informado'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">CPF</label>
              <p className="font-mono">{formatCPF(pessoa?.CPF)}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Data de Nascimento</label>
              <p>{pessoa?.DATA_NASCIMENTO ? formatDate(pessoa.DATA_NASCIMENTO) : 'Não informado'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Situação Cadastral</label>
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${pessoa?.SITUACAO_CADASTRAL === 'REGULAR' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {pessoa?.SITUACAO_CADASTRAL || 'Não informado'}
              </span>
            </div>
          </div>

          {/* Score e Renda */}
          <div className="border-t border-gray-200 my-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Score de Crédito</label>
              <p className="text-2xl font-bold text-blue-600">{data.dados.credCadastral?.SCORE || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Renda Presumida</label>
              <p className="text-xl font-semibold">{formatCurrency(data.dados.credCadastral?.RENDA_PRESUMIDA)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endereços */}
      {enderecos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Endereços ({enderecos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {enderecos.map((endereco: any, index: number) => (
                <div key={index} className="p-3 border rounded-lg">
                  <p className="font-medium">
                    {endereco.LOGRADOURO}, {endereco.NUMERO}
                  </p>
                  <p className="text-sm text-gray-600">
                    {endereco.BAIRRO} - {endereco.CIDADE}/{endereco.UF}
                  </p>
                  <p className="text-sm font-mono">CEP: {formatCEP(endereco.CEP)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contatos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Telefones */}
        {telefones.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Telefones ({telefones.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {telefones.map((tel: any, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">{tel.TIPO}</span>
                    <span>({tel.DDD}) {tel.NUMERO}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Emails */}
        {emails.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Emails ({emails.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {emails.map((email: string, index: number) => (
                  <div key={index} className="p-2 bg-gray-50 rounded">
                    {email}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Componente para CRLV RO
const CRLVRO: React.FC<{ data: BigTechResponse }> = ({ data }) => {
  // Verificações defensivas
  if (!data || !data.dados) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-muted-foreground">Dados da consulta não disponíveis.</p>
        </CardContent>
      </Card>
    );
  }

  const veiculo = data.dados.veicular?.VEICULO;
  const proprietario = data.dados.veicular?.PROPRIETARIO_ATUAL;
  const situacao = data.dados.veicular?.SITUACAO_VEICULAR;

  return (
    <div className="space-y-4">
      {/* Dados do Veículo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Dados do Veículo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Placa</label>
              <p className="font-mono text-lg">{veiculo?.PLACA}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Marca</label>
              <p>{veiculo?.MARCA}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Modelo</label>
              <p>{veiculo?.MODELO}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Ano Fabricação</label>
              <p>{veiculo?.ANO_FABRICACAO}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Ano Modelo</label>
              <p>{veiculo?.ANO_MODELO}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Cor</label>
              <p>{veiculo?.COR}</p>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="text-sm font-medium">Chassi</label>
              <p className="font-mono text-sm">{veiculo?.CHASSI}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proprietário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Proprietário Atual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium">Nome</label>
            <p className="text-lg">{proprietario?.NOME}</p>
          </div>
          <div>
            <label className="text-sm font-medium">CPF/CNPJ</label>
            <p className="font-mono">{proprietario?.CPF_CNPJ}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Endereço</label>
            <p>{proprietario?.ENDERECO}</p>
          </div>
        </CardContent>
      </Card>

      {/* Situação Veicular */}
      <Card>
        <CardHeader>
          <CardTitle>Situação Veicular</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${situacao?.STATUS === 'REGULAR' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {situacao?.STATUS}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium">Débitos IPVA</label>
              <p className="font-semibold text-red-600">
                {formatCurrency(situacao?.DEBITOS_IPVA)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Débitos DPVAT</label>
              <p className="font-semibold text-red-600">
                {formatCurrency(situacao?.DEBITOS_DPVAT)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Multas Pendentes</label>
              <p className="font-semibold text-orange-600">
                {situacao?.MULTAS_PENDENTES || 0}
              </p>
            </div>
          </div>

          {situacao?.RESTRICOES?.length > 0 && (
            <div className="mt-4">
              <label className="text-sm font-medium">Restrições</label>
              <div className="mt-2 space-y-1">
                {situacao.RESTRICOES.map((restricao: string, index: number) => (
                  <span key={index} className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium mr-2">{restricao}</span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Componente genérico para serviços não específicos
const GenericDisplay: React.FC<{ data: BigTechResponse }> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados da Consulta</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
          {JSON.stringify(data.dados, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
};

// Funções utilitárias
const formatCurrency = (value: number): string => {
  if (!value) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatCPF = (cpf: string): string => {
  if (!cpf) return '';
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

const formatCEP = (cep: string): string => {
  if (!cep) return '';
  return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
};

const formatDate = (date: string): string => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('pt-BR');
};

const getServiceName = (serviceCode: string): string => {
  const names: Record<string, string> = {
    '1539-bvs-basica-pf': 'BVS Básica PF',
    '11-bvs-basica-pj': 'BVS Básica PJ',
    '1003-scr-premium-integracoes': 'SCR Premium',
    '320-contatos-por-cep': 'Contatos por CEP',
    '411-crlv-ro': 'CRLV Rondônia'
  };
  return names[serviceCode] || serviceCode;
};

// Componentes stub para outros serviços (implementar conforme necessário)
const BVSBasicaPJ: React.FC<{ data: BigTechResponse }> = ({ data }) => <GenericDisplay data={data} />;
const SCRPremium: React.FC<{ data: BigTechResponse }> = ({ data }) => <GenericDisplay data={data} />;
const ContatosPorCEP: React.FC<{ data: BigTechResponse }> = ({ data }) => <GenericDisplay data={data} />;


export default ServiceDisplay;
