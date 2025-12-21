# APIS DOS SERVIÇOS SELECIONADOS

## CENPROT SP / Protestos

* Documentação da API (v2)
* Versão da API: 2.2.33 (17/12/2025)

## Descrição
Consulta a existência e os dados de Protestos de pessoas físicas e jurídicas na Central de Protesto do Estado de São Paulo (CENPROT-SP). Apenas os resultados de SP tem retorno detalhado. São retornados resultados apenas da primeira página exibida pelo site.

## Preço adicional
Esta API tem um preço adicional de R$ 0,06000 por chamada.

## URL do site
https://protestosp.com.br/consulta-de-protesto

## Requisição
URL para POST:
https://api.infosimples.com/api/v2/consultas/cenprot-sp/protestos

## Parâmetro	Descrição
token *	Chave de acesso da API. É com o token que a API reconhece e autoriza quem está fazendo a chamada.
cnpj **	CNPJ da empresa a ser consultada.
cpf **	CPF do indivíduo a ser consultado.
* Parâmetro obrigatório.

** Parâmetro opcional. Pode ser necessário informar algum dos parâmetros opcionais para que a consulta funcione adequadamente.

Exemplos de respostas:
* lens 200
{
  "code": 200,
  "code_message": "A requisição foi processada com sucesso.",
  "errors": [],
  "header": {
    "api_version": "v2",
    "api_version_full": "2.2.6-20230424101622",
    "product": "Consultas",
    "service": "cenprot-sp/protestos",
    "parameters": {
      "cnpj": "12.345.678/9012-34"
    },
    "client_name": "Minha Empresa",
    "token_name": "Token de Produção",
    "billable": true,
    "price": "0.24",
    "requested_at": "2023-04-24T14:36:45.000-03:00",
    "elapsed_time_in_milliseconds": 449,
    "remote_ip": "111.111.111.111",
    "signature": "U2FsdGVkX191VszUDWg9Ujz8CI3nCyHMlQutZUAri39nkyTEJfOU9s/sQhEw1ubCFBbTFDMgBt+nQNVQiDCPQw=="
  },
  "data_count": 1,
  "data": [
    {
      "cartorios": {
        "SP": [
          {
            "codigo": "111",
            "nome": "Exemplo de Nome",
            "endereco": "Avenida Paulista, 807. São Paulo. SP. Brasil.",
            "telefone": "(11) 1111-1111",
            "comarca": "BARUERI",
            "quantidade": 2,
            "valor_string": "R$ 15.057,99",
            "valor": 15057.99,
            "municipio": "SAO PAULO / SP",
            "cidade": "São Paulo",
            "bairro": "Bela Vista",
            "protestos": [
              {
                "cpf_cnpj": "12.345.678/9012-34",
                "valor_string": "R$ 5.181,58",
                "valor": 5181.58,
                "valor_cancelamento_string": "R$ 945,73",
                "valor_cancelamento": 945.73,
                "valor_quitacao_string": "-------",
                "valor_quitacao": 0.0,
                "observacoes": ""
              }
            ]
          }
        ]
      },
      "protocolo_consulta": "01234567890",
      "documento_pesquisado": "11111111111111",
      "retornou_todos_os_protestos_do_site": true,
      "quantidade_titulos": 1,
      "site_receipt": "https://www.exemplo.com/exemplo-de-url"
    }
  ],
  "site_receipts": [
    "https://www.exemplo.com/exemplo-de-url"
  ]
}

lens 600

{
  "code": 600,
  "code_message": "Um erro inesperado ocorreu e será analisado.",
  "errors": [],
  "header": {
    "api_version": "v2",
    "api_version_full": "2.2.33-20251219183709",
    "product": null,
    "service": "cenprot-sp/protestos",
    "parameters": {
      "cnpj": "",
      "cpf": ""
    },
    "client_name": "Minha Empresa LTDA",
    "token_name": "desenvolvimento",
    "billable": false,
    "price": "0.0",
    "requested_at": "2025-12-21T16:12:48.609-03:00",
    "elapsed_time_in_milliseconds": 1172,
    "remote_ip": null,
    "signature": "OWVfYtn4N+HneQnHt1Pao7MC36rmaurTzAoJKqS/iLfIIGYotlzXDtB06/7J+h72jgq9+rBqjcdwymd2Ca6HPcBeo+F6RtPK2xiAzA=="
  },
  "data_count": 0,
  "data": [],
  "site_receipts": [
    "https://api.infosimples.com/exemplo-de-url"
  ]
}

601

{
  "code": 601,
  "code_message": "Não foi possível se autenticar com o token informado.",
  "errors": [],
  "header": {
    "api_version": "v2",
    "api_version_full": "2.2.33-20251219183709",
    "product": null,
    "service": "cenprot-sp/protestos",
    "parameters": {
      "cnpj": "",
      "cpf": ""
    },
    "client_name": "Minha Empresa LTDA",
    "token_name": "desenvolvimento",
    "billable": false,
    "price": "0.0",
    "requested_at": "2025-12-21T16:12:48.637-03:00",
    "elapsed_time_in_milliseconds": 1548,
    "remote_ip": null,
    "signature": "NLO7X26q1JjxFhVZpcfuh64EADsayuyk0CLWgXAh3A4R5idQ1UuYXTsCMVInRTbVR5aZDjFqxI7N//KCLySTM+pJGUSlf0kx3U5j6g=="
  },
  "data_count": 0,
  "data": [],
  "site_receipts": [
    "https://api.infosimples.com/exemplo-de-url"
  ]
}

{
  "code": 602,
  "code_message": "O serviço informado na URL não é válido.",
  "errors": [],
  "header": {
    "api_version": "v2",
    "api_version_full": "2.2.33-20251219183709",
    "product": null,
    "service": "cenprot-sp/protestos",
    "parameters": {
      "cnpj": "",
      "cpf": ""
    },
    "client_name": "Minha Empresa LTDA",
    "token_name": "desenvolvimento",
    "billable": false,
    "price": "0.0",
    "requested_at": "2025-12-21T16:12:48.666-03:00",
    "elapsed_time_in_milliseconds": 1451,
    "remote_ip": null,
    "signature": "IqhkNwL7gq4j9jpo4MGBfbQavLef2tOtJ7Zvy1xI730Pz4Pyh5aIluVXxnmueCf5Y5ndW1fZH4P48XPlbEEj8dwJBr/ntx6U1ZhHYw=="
  },
  "data_count": 0,
  "data": [],
  "site_receipts": [
    "https://api.infosimples.com/exemplo-de-url"
  ]
}

{
  "code": 603,
  "code_message": "O token informado não tem autorização de acesso ao serviço. Verifique se ele continua ativo e se ele não possui algum limite de uso especificado.",
  "errors": [],
  "header": {
    "api_version": "v2",
    "api_version_full": "2.2.33-20251219183709",
    "product": null,
    "service": "cenprot-sp/protestos",
    "parameters": {
      "cnpj": "",
      "cpf": ""
    },
    "client_name": "Minha Empresa LTDA",
    "token_name": "desenvolvimento",
    "billable": false,
    "price": "0.0",
    "requested_at": "2025-12-21T16:12:48.695-03:00",
    "elapsed_time_in_milliseconds": 1987,
    "remote_ip": null,
    "signature": "E+mwhrjvT26Nkjg/v3CsZYH3u+nKaCJ0c34EOvzFZ+nPKYRAh4UlK4RjTnKHd3tvQ3RnrUudanh3VGMUeF3IDK9uew3gPSOqk1+vOQ=="
  },
  "data_count": 0,
  "data": [],
  "site_receipts": [
    "https://api.infosimples.com/exemplo-de-url"
  ]
}

## Arquivo de visualização de consulta
O arquivo de visualização de consulta (site_receipts) disponibilizado no retorno da API pode ser sintetizado pela Infosimples usando as informações originais da fonte quando o arquivo emitido pela fonte não for adequado para visualização.

## Testado com: Shell/cURL 8.14.1

curl --request POST \
  --url "https://api.infosimples.com/api/v2/consultas/cenprot-sp/protestos" \
  --data "cnpj=VALOR_DO_PARAMETRO_CNPJ" \
  --data "cpf=VALOR_DO_PARAMETRO_CPF" \
  --data "token=INFORME_AQUI_O_TOKEN_DA_CHAVE_DE_ACESSO" \
  --data "timeout=300"
Estamos prontos para ajudar
Ainda tem alguma dúvida ou precisa de ajuda na sua integração? Entre em contato em suporte@infosimples.com.br e receba ajuda da nossa equipe técnica altamente qualificada.