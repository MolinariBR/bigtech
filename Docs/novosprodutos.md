Integração  Credito  10 - BVS BASICA PF
Este documento tem o intuito de auxiliar no desenvolvimento da consulta 10 - BVS BASICA PF. Deve ser enviada uma solicitação POST com o JSON de requisição para a URL do serviço.


URL do Serviço/Producao:

https://api.consultasbigtech.com.br/json/service.aspx


Parâmetros de entrada

Parâmetro	Tipo	Requisição	Detalhes
CodigoProduto	Numérico/Inteiro	Obrigatório	Informe o código : 1539 (Apesar de ser um número inteiro, deve ser enviado entre aspas duplas, como uma string. Ex: "1539" )
Versao	Alfanumérico	Obrigatório	Informe o código 20180521
ChaveAcesso	Alfanumérico	Obrigatório	Informe a chave de acesso usada como credencial.
Solicitante	Numérico/Inteiro	Opcional	Informe o CNPJ do cliente final, para que o mesmo apareça como responsável pela consulta junto ao provedor de informações. O mesmo deverá ser previamente cadastrado no nosso sistema.
CPFCNPJ	Numérico/Inteiro	Obrigatório	CPF (Pessoa física) . Somente números, com 11 caracteres. Ex: 00000000191.
TipoPessoa	Alfanumérico	Obrigatório	Informe "F".

WebHook/UrlCallBack	Alfanumérico	Opcional	Informe a URL de atualização da consulta, ex: https://app.meusistema.com.br/webhook/servico.aspx
O parametro Versao tem unicamente a função de permitir que integradores possam continuar utilizando uma versão mais antiga do webservice até efetuarem a adequação para a versão mais recente. Caso seja informado um valor em branco/vazio ou uma versão inválida/inexistente, será retornado um erro. A disponibilização de uma versão anterior da resposta do serviço tem prazo máximo de 15 dias, podendo ser extendido ou reduzido caso a empresa provedora julgue necessário. Na tabela acima estão especificados todos os outros parâmetros opcionais ou não para execução de cada consulta.

O parametro WebHook//UrlCallBack é opcional. Ele é usado para caso haja alguma atualização da consulta na fonte, será enviada para a URL informada um POST com o resultado atualizado do mesma. Juntamente com esse resultado, será enviado um header da requisição (REQUISICAO_ID), o valor do campo HEADER//INFORMACOES_RETORNO//REQUISICAO da consulta original, com a finalidade de autenticação da origem da chamada e identificacão da consulta a ser atualizada. A URL informada deve ser válida e com protocolo HTTPS(Hypertext Transfer Protocol Secure), também serão aceitos URLs com parametros adicionais (QueryStrings) criados pelo usuário, com finalidade de identificação da consulta a ser atualizada, Ex: https://app.meusistema.com.br/webhook/servico.aspx?codigo_interno=xxxxxxxxx

(*) Campos opcionais marcados com esse símbolo descrevem parâmetros onde pelo menos um deles é obrigatório. Deve-se selecionar uma das opções por consulta e fazer o envio do parâmetro desejado.

 TRATE SUA CHAVE DE ACESSO COMO SENHA!
Não inclua sua chave de acesso publicamente em nenhum lugar do seu site ou javascript; não se esqueça que ela funciona como uma senha, liberando suas transações de forma automática e autenticada.


Exemplo de JSON de requisição

{
    "CodigoProduto": "1539",
    "Versao": "20180521",
    "ChaveAcesso": "ZzM67lS3CL7SSW6680p9fEcNPcD5wE88aSQa/D3EnDeL6cnwsrkpmrCsSt4dssftiiooSega",
    "Info": {
        "Solicitante": "IDENTIFICAÇÃO DO CLIENTE FINAL (OPCIONAL)"
    },
    "Parametros": {
        "TipoPessoa": "F",
        "CPFCNPJ": "66602378015"
    },
    "WebHook": {
        "UrlCallBack": ""
    }
}
Após devidamente montada, a string contendo o JSON de requisição deve ser enviado via método POST diretamente para a URL do Serviço.



Retornos contidos na consulta
#	Tipo de retorno	Descrição	 
1	Receita Federal	Informações atualizadas da receita federal para pessoa jurídica e física	
3	Agência Bancária	Informações da agência bancária do cheque consultado	
5	Protesto Analítico	Informações completas de protestos	
12	Pendências Financeiras	Registro geral de inadimplências de pessoas físicas ou jurídicas	
17	Recheque	Verificação do status do cheque consultado	
18	Contumácia	Registro de frequência de sustação de cheques no mercado.	
19	Endereço do CEP	Confirmação do endereço do CEP informado	
21	Informações/Alertas/Restrições	Dados avulsos sem categoria própria.	


Exemplo de JSON de resposta
O webservice retorna consultas no formato JSON, neste manual estão todos os exemplos JSON, de cada resposta possível do serviço. Como as Tags são auto explicativas não se faz necessário a verificação e análise de todas (Qualquer dúvida poderá ser resolvida diretamente com nosso suporte técnico).


{
    "HEADER": {
        "INFORMACOES_RETORNO": {
            "VERSAO": "20180521",
            "STATUS_RETORNO": {
                "CODIGO": "1",
                "DESCRICAO": "CONSULTA CONCLUIDA COM SUCESSO"
            },
            "CHAVE_CONSULTA": "1022687",
            "PRODUTO": "1539-10 - BVS BASICA PF",
            "CLIENTE": "01.523.638/0001-72-REVENDA PRINCIPALS",
            "DATA_HORA_CONSULTA": "07/02/2019 18:20",
            "TERMINAL": "",
            "SOLICITANTE": "",
            "PDF": "",
            "PDF_ALERTA": "",
            "ENTIDADE": "",
            "REQUISICAO": "",
            "WEBHOOK_CALLBACK": "",
            "TEMPO_RESPOSTA": {
                "INICIO": "",
                "FINAL": "",
                "INTERVALO": ""
            }
        },
        "PARAMETROS": {
            "CPFCNPJ": "66602378015",
            "TIPO_PESSOA": "11"
        },
        "DADOS_RETORNADOS": {
            "DADOS_RECEITA_FEDERAL": "1",
            "ALERTA_DOCUMENTOS_ROUBADOS": "0",
            "DADOS_AGENCIA_BANCARIA": "1",
            "PROTESTO_SINTETICO": "0",
            "PROTESTO_ANALITICO": "1",
            "ENDERECOS": "0",
            "FALENCIAS_ACOES_RECUPERACOES": "0",
            "INFORMACOES_ELEITORAIS": "0",
            "QUADRO_SOCIETARIO": "0",
            "PARTICIPACAO_EM_EMPRESAS": "0",
            "PENDENCIAS_INTERNAS": "0",
            "PENDENCIAS_FINANCEIRAS": "1",
            "INFORMACOES_DA_EMPRESA": "0",
            "CCF_BACEN": "0",
            "CCF_VAREJO": "0",
            "RECHEQUE_ONLINE": "0",
            "RECHEQUE": "1",
            "CONTUMACIA": "1",
            "ENDERECO_DO_CEP": "1",
            "PASSAGENS_COMERCIAIS": "0",
            "INFORMACOES_ALERTAS_RESTRICOES": "1",
            "SCORE": "0",
            "ADMINISTRADORES_DA_EMPRESA": "0",
            "TITULOS_A_VENCER": "0",
            "HISTORICO_DE_PAGAMENTOS": "0",
            "REFERENCIA_DE_NEGOCIOS": "0",
            "PRINCIPAIS_FORNECEDORES": "0",
            "IDENTIFICACAO_PESSOA_FISICA": "0",
            "OCUPACAO_PESSOA_FISICA": "0",
            "PARTICIPACAO_EM_FALENCIAS": "0",
            "TELEFONE_FIXO": "0",
            "TITULAR_DO_TELEFONE": "0",
            "OUTROS_TELEFONES": "0",
            "TELEFONE_CELULAR": "0",
            "PARENTES": "0",
            "CONTATOS": "0",
            "LOCAIS_TRABALHO": "0",
            "TELEFONE_COMERCIAL": "0",
            "DADOS_GERAIS": "0",
            "VIZINHOS": "0",
            "RESIDENTES": "0",
            "BENEFICIO": "0",
            "EMAILS": "0",
            "INFOBUSCA": "0",
            "VINCULO_MESMO_ENDERECO": "0",
            "SOMENTE_TELEFONE": "0",
            "SOMENTE_ENDERECO": "0",
            "RELATORIO_TEXTO": "0",
            "VEICULOS_POR_DOCUMENTO": "0",
            "CNH": "0",
            "AGREGADOS": "0",
            "BIN_NACIONAL": "0",
            "BIN_ESTADUAL": "0",
            "GRAVAME": "0",
            "LEILAO": "0",
            "CONFERENCIA_MOTOR_E_CHASSI": "0",
            "HISTORICO_PROPRIETARIOS": "0",
            "HISTORICO_ROUBO_FURTO": "0",
            "ROUBO_FURTO": "0",
            "PERDA_TOTAL": "0",
            "ALERTAS": "0",
            "RECALL": "0",
            "DPVAT": "0",
            "DECODIFICADOR_DE_CHASSI": "0",
            "PRECIFICADOR": "0",
            "RENAJUD": "0",
            "RENACH": "0",
            "CRLV": "0",
            "REMARKETING": "0",
            "INDICIO_SINISTRO": "0",
            "PARECER_TECNICO": "0",
            "PENDENCIAS_REFIN": "0",
            "PENDENCIAS_VENCIDAS": "0",
            "LOCALIZADOR_AGREGADOS": "0",
            "CARACTERISTICAS_ADICIONAIS": "0",
            "LAUDO_CAUTELAR": "0",
            "DECISAO": "0",
            "LIMITE_CREDITO": "0",
            "FATURAMENTO_PRESUMIDO": "0",
            "PARTICIPACAO_SOCIO_ADM_OUTRAS_EMPRESAS": "0",
            "PARTICIPACOES_EMPRESAS_CONSULTADAS": "0",
            "HIST_CONSULTAS": "0",
            "ACOES_CIVEIS": "0",
            "FALENCIA_RECUPERACAO_JUDICIAL": "0",
            "ANALISE_KILOMETRAGEM": "0",
            "PONTUALIDADE_PAGTO": "0",
            "PROPRIETARIO_ATUAL_VEICULO": "0",
            "VALIDACAO_PESSOA_FISICA": "0",
            "VALIDACAO_PF_BASICA": "0",
            "VALIDACAO_PF_BIOMETRIA_FACE": "0",
            "VALIDACAO_PF_CNH": "0",
            "VALIDACAO_PF_DOCUMENTO": "0",
            "VALIDACAO_PF_ENDERECO": "0",
            "VALIDACAO_PF_FILIACAO": "0",
            "AUTO_VISTORIA": "0",
            "INDICE_SECURITARIO": "0",
            "CALCULO_VALORIZACAO": "0",
            "ATPVE": "0",
            "CREDITO_CONCEDIDO": "0",
            "RENDA_PRESUMIDA": "0",
            "COMPROMETIMENTO_PAGTO": "0",
            "LEILAO_CONJUGADO": "0",
            "CSV": "0",
            "RENAINF": "0",
            "RELATORIO_ARQUIVO": "0",
            "INDICIO_SINISTRO_CONJUGADO": "0",
            "CONSULTA_GENERICA": "0",
            "BATIDOS": "0",
            "RELATORIO_SCR": "0",
            "CADIN": "0",
            "ACOES_TRABALHISTAS": "0",
            "RELATORIO_SCR_SINTETICO": "0",
            "CPR": "0",
            "FICHA_TECNICA_VEICULAR": "0",
            "CHECK_LIST_VEICULAR": "0",
            "DIVIDA_ATIVA_PESSOA_FISICA": "0",
            "DIVIDA_ATIVA_PESSOA_JURIDICA": "0",
            "PENDENCIAS_ISP": "0",
            "RELATORIO_JURIDICO_EMPRESARIAL": "0",
            "INFORMACOES_CRIMINAIS": "0",
            "PROCURADOS_JUSTICA": "0",
            "RELATORIO_JURIDICO_PESSOA_FISICA": "0",
            "DETALHAMENTO_ACAO_JUDICIAL": "0",
            "RELATORIO_IMOVEIS": "0",
            "DEBITOS_IPVA": "0",
            "DEBITO_DIRETO_AUTORIZADO": "0",
            "CONTROLE_POSITIVO": "0",
            "ALERTA_INDICIO": "0",
            "RELATORIO_CREDITICIO_ARQUIVO": "0",
            "IMAGENS_VEICULO": "0",
            "RELATORIO_SCR_ENCAPSULADO": "0",
            "RESTRICOES_FINANCEIRAS": "0",
            "ALERTA_VEICULAR_PROPRIEDADE": "0",
            "MOTOR_CREDITO": "0",
            "ALTERACAO_CARACTERISTICAS": "0",
            "DEBITOS_VEICULARES": "0",
            "RESTRICOES_SINTETICAS": "0",
            "ACOES_JUDICIAIS_COMPLETAS": "0",
            "PERIODO_RELACIONAMENTO_FORNECEDORES": "0",
            "EVENTOS_PESSOA_JURIDICA": "0",
            "CREDITO_OBTIDO": "0",
            "COMPROMISSOS": "0",
            "PAGAMENTO_PONTUAL": "0",
            "PAGAMENTO_ATRASADO": "0",
            "COMPROMETIMENTO_FUTURO": "0",
            "ANTECEDENTES_PESSOAIS": "0",
            "COMUNICADO_VENDA": "0",
            "ANTT_TRANSPORTADOR": "0",
            "ANTT_VEICULO": "0",
            "HIST_TRANSFERENCIA_NACIONAL": "0"
        },
        "CONTROLE": {
            "QUANTIDADE_OCORRENCIAS": "1",
            "OCORRENCIAS": [
                {
                    "CONTEUDO": "1",
                    "FONTE": "1",
                    "STATUS": "1"
                }
            ]
        }
    },
    "CREDCADASTRAL": {
        "DADOS_RECEITA_FEDERAL": {
            "STATUS_RETORNO": {
                "CODIGO": "1",
                "DESCRICAO": "CONSULTA CONCLUIDA COM SUCESSO"
            },
            "TIPO_PESSOA": "FISICA",
            "NOME": "ALESSANDRA DAS GRACAS ALVES DOS SANTOS",
            "RAZAO_SOCIAL": "",
            "SITUACAO_RECEITA": "REGULAR",
            "DATA_NASCIMENTO_FUNDACAO": "27/12/1977",
            "NOME_MAE": "NEUZA CASTRIGNANI DOS SANTOS",
            "DATA_ATUALIZACAO": "",
            "SEXO": "",
            "EMAIL": "",
            "NATUREZA_JURIDICA": "",
            "ATIVIDADE_ECONOMICA_PRINCIPAL": ""
        },
        "INFORMACOES_ALERTAS_RESTRICOES": {
            "STATUS_RETORNO": {
                "CODIGO": "1",
                "DESCRICAO": "CONSULTA CONCLUIDA COM SUCESSO"
            },
            "QUANTIDADE_OCORRENCIA": "7",
            "OCORRENCIAS": [
                {
                    "CODIGO_TIPO_INFORMACAO": "1",
                    "DESCRICAO_TIPO_INFORMACAO": "INFORMACAO",
                    "TITULO": "RENDA POR EMPRESA",
                    "OBSERVACOES": "RIO CLARO AGROINDUSTRIAL S A - R$ 1636,07"
                },
                {
                    "CODIGO_TIPO_INFORMACAO": "1",
                    "DESCRICAO_TIPO_INFORMACAO": "INFORMACAO",
                    "TITULO": "RENDA POR EMPRESA",
                    "OBSERVACOES": "SJC BIOENERGIA - R$ 5,54"
                },
                {
                    "CODIGO_TIPO_INFORMACAO": "1",
                    "DESCRICAO_TIPO_INFORMACAO": "INFORMACAO",
                    "TITULO": "RENDA POR EMPRESA",
                    "OBSERVACOES": "BRENCO CENTRO OESTE INDUSTRIA E COMERCIO DE ETANOL - R$ 900"
                },
                {
                    "CODIGO_TIPO_INFORMACAO": "1",
                    "DESCRICAO_TIPO_INFORMACAO": "INFORMACAO",
                    "TITULO": "TRABALHO",
                    "OBSERVACOES": "TRATORISTA AGRICOLA"
                },
                {
                    "CODIGO_TIPO_INFORMACAO": "1",
                    "DESCRICAO_TIPO_INFORMACAO": "INFORMACAO",
                    "TITULO": "PIS/PASEP",
                    "OBSERVACOES": "12027759346"
                },
                {
                    "CODIGO_TIPO_INFORMACAO": "1",
                    "DESCRICAO_TIPO_INFORMACAO": "INFORMACAO",
                    "TITULO": "ESCOLARIDADE",
                    "OBSERVACOES": "ENSINO MEDIO COMPLETO"
                },
                {
                    "CODIGO_TIPO_INFORMACAO": "1",
                    "DESCRICAO_TIPO_INFORMACAO": "INFORMACAO",
                    "TITULO": "RENDA ESTIMADA",
                    "OBSERVACOES": "1636,07"
                }
            ]
        },
        "DADOS_AGENCIA_BANCARIA": {
            "STATUS_RETORNO": {
                "CODIGO": "",
                "DESCRICAO": ""
            },
            "EXISTE_REGISTRO": "",
            "NOME_AGENCIA": "",
            "DT_ULTIMA_ATUALIZACAO": "",
            "TELEFONE": "",
            "FAX": "",
            "ENDERECO": "",
            "CIDADE": "",
            "UF": ""
        },
        "PEND_FINANCEIRAS": {
            "STATUS_RETORNO": {
                "CODIGO": "1",
                "DESCRICAO": "CONSULTA CONCLUIDA COM SUCESSO"
            },
            "QUANTIDADE_OCORRENCIA": "4",
            "VALOR_TOTAL": "",
            "ULTIMO_VENCIMENTO": "",
            "DATA_PRIMEIRO": "",
            "TOTAL_CREDORES": "",
            "VALOR_MAIOR": "",
            "VALOR_PRIMEIRO": "",
            "PERIODO_INICIAL": "",
            "PERIODO_FINAL": "",
            "DATA_MAIOR": "",
            "PROVEDORES": [
                {
                    "PROVEDOR": "BASE I"
                }
            ],
            "OCORRENCIAS": [
                {
                    "DATA_VENCIMENTO": "15/01/2019",
                    "DATA_INCLUSAO": "",
                    "INFORMANTE": "BASE I",
                    "TIPO_DEVEDOR": "COMPRADOR",
                    "CREDOR": "MAGNUM INDUSTRIA DA",
                    "MOEDA": "R$",
                    "VALOR": "1181,28",
                    "CONTRATO": "0920463904",
                    "ORIGEM": "",
                    "SUBJUDICE": "",
                    "MODALIDADE": "DUPLICATA",
                    "ENTIDADE": ""
                },
                {
                    "DATA_VENCIMENTO": "02/01/2019",
                    "DATA_INCLUSAO": "",
                    "INFORMANTE": "BASE I",
                    "TIPO_DEVEDOR": "COMPRADOR",
                    "CREDOR": "MAGNUM INDUSTRIA DA",
                    "MOEDA": "R$",
                    "VALOR": "658,65",
                    "CONTRATO": "NE02099101",
                    "ORIGEM": "",
                    "SUBJUDICE": "",
                    "MODALIDADE": "DUPLICATA",
                    "ENTIDADE": ""
                },
                {
                    "DATA_VENCIMENTO": "28/12/2018",
                    "DATA_INCLUSAO": "",
                    "INFORMANTE": "BASE I",
                    "TIPO_DEVEDOR": "COMPRADOR",
                    "CREDOR": "MAGNUM INDUSTRIA DA",
                    "MOEDA": "R$",
                    "VALOR": "615,57",
                    "CONTRATO": "0920590502",
                    "ORIGEM": "",
                    "SUBJUDICE": "",
                    "MODALIDADE": "DUPLICATA",
                    "ENTIDADE": ""
                },
                {
                    "DATA_VENCIMENTO": "16/12/2018",
                    "DATA_INCLUSAO": "",
                    "INFORMANTE": "BASE I",
                    "TIPO_DEVEDOR": "COMPRADOR",
                    "CREDOR": "MAGNUM INDUSTRIA DA",
                    "MOEDA": "R$",
                    "VALOR": "1181,30",
                    "CONTRATO": "0920463903",
                    "ORIGEM": "",
                    "SUBJUDICE": "",
                    "MODALIDADE": "DUPLICATA",
                    "ENTIDADE": ""
                }
            ]
        },
        "PROTESTOS": {
            "STATUS_RETORNO": {
                "CODIGO": "1",
                "DESCRICAO": "CONSULTA CONCLUIDA COM SUCESSO"
            },
            "VALOR_TOTAL": "",
            "ULTIMO_PROTESTO": "",
            "QUANTIDADE_OCORRENCIA": "0",
            "DATA_PRIMEIRO": "",
            "VALOR_PRIMEIRO": "",
            "DATA_ULTIMO": "",
            "VALOR_ULTIMO": "",
            "DATA_MAIOR": "",
            "VALOR_MAIOR": "",
            "OCORRENCIAS": [
                {
                    "DATA": "11/06/2018",
                    "MOEDA": "R$",
                    "VALOR": "654,95",
                    "QUANTIDADE": "",
                    "CARTORIO": "",
                    "ORIGEM": "JARAGUA DO SUL-SC",
                    "CREDOR": "DOC.:",
                    "TIPO_ANOTACAO": "TITULO PROTESTADO",
                    "SUBJUDICE": "",
                    "VENCIMENTO": ""
                },
                {
                    "DATA": "01/03/2018",
                    "MOEDA": "R$",
                    "VALOR": "894,25",
                    "QUANTIDADE": "",
                    "CARTORIO": "",
                    "ORIGEM": "JARAGUA DO SUL-SC",
                    "CREDOR": "DOC.:",
                    "TIPO_ANOTACAO": "TITULO PROTESTADO",
                    "SUBJUDICE": "",
                    "VENCIMENTO": ""
                }
            ]
        },
        "RECHEQUE": {
            "STATUS_RETORNO": {
                "CODIGO": "1",
                "DESCRICAO": "CONSULTA CONCLUIDA COM SUCESSO"
            },
            "QUANTIDADE_OCORRENCIAS": "0"
        },
        "CONTUMACIA": {
            "STATUS_RETORNO": {
                "CODIGO": "1",
                "DESCRICAO": "CONSULTA CONCLUIDA COM SUCESSO"
            },
            "QUANTIDADE_OCORRENCIA": "0",
            "DATA_PRIMEIRA_OCORRENCIA": "",
            "DATA_ULTIMA_OCORRENCIA": ""
        },
        "ENDERECO_CEP": {
            "STATUS_RETORNO": {
                "CODIGO": "",
                "DESCRICAO": ""
            },
            "EXISTE_OCORRENCIA": "",
            "CEP": "",
            "ENDERECO": "",
            "BAIRRO": "",
            "CIDADE": "",
            "UF": "",
            "GENERICO": ""
        }
    },
    "VEICULAR": {
        
    }
}


Exemplo de retorno com erro
Caso haja um erro geral na consulta, o mesmo será descrito como exemplificado abaixo.


{
    "HEADER": {
        "INFORMACOES_RETORNO": {
            "VERSAO": "",
            "STATUS_RETORNO": {
                "CODIGO": "0",
                "DESCRICAO": "HOUVE UM ERRO NA CONSULTA"
            },
            "CHAVE_CONSULTA": "",
            "PRODUTO": "",
            "CLIENTE": "",
            "DATA_HORA_CONSULTA": "25/12/2025 10:52",
            "TERMINAL": "",
            "SOLICITANTE": "",
            "PDF": "",
            "PDF_ALERTA": "",
            "ENTIDADE": "",
            "REQUISICAO": "",
            "WEBHOOK_CALLBACK": "",
            "TEMPO_RESPOSTA": {
                "INICIO": "",
                "FINAL": "",
                "INTERVALO": ""
            },
            "INFORM_EXTERNO": {
                "REQUISICAO_EXTERNA": "",
                "ENTIDADE_EXTERNA": "",
                "CHAVE_EXTERNA": ""
            }
        }
    }
}