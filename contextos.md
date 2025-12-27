Dados de login:

Email: admin2@bigtech.com
Senha: admin123

user@bigtech.com
user1234


Bigtech, nossa plataforma de integração de serviços, oferece uma variedade de plugins para ampliar suas funcionalidades. A seguir, detalhamos as opções de configuração essenciais que foram removidas da interface de administração, mas que são cruciais para o correto funcionamento dos plugins. 

Dividimos os plugins por tipo e separados por hieararquia de pastas e arquivos:

* plugins/consulta
* plugins/pagamentos
* plugins/(mais no futuro).

Mas você removeu as opçoes de configuração de URL e API Key dos plugins na interface de administração. 
Isso gera um problema que fica complicado para o usuario final configurar os plugins, ja que essas informaçoes sao essenciais para o funcionamento dos mesmos. Como:

* Botão de Instalar/Desinstalar Plugin.
* Modal para configurar API Key e URL (produção/homologação) por Plugin.
* Validação de conectividade com a API do plugin.
* Validar persistencia das configurações no Appwrite.

Outras Configurações inportantes para plugins de consulta. plugin/consulta/:

- Configuração de preço por serviço/card de serviço do plugin de consulta. plugin/consult/:
- Configuração de fallback de serviços dentro do plugin de consulta. Regra individual por serviço/card de serviço dentro do plugin de consulta.

OBS: Persistencia no Appwrite e validação de API Key são cruciais para garantir que as configurações sejam mantidas e que os plugins funcionem corretamente. Antes de qualquer alteração, é importante considerar o impacto na experiência do usuário e na funcionalidade geral da plataforma.
- Teste de conectividade ao salvar as configurações.
- Armazenamento seguro das chaves de API no Appwrite.
- Interface amigável para facilitar a configuração pelos usuários.
- Documentação clara sobre como configurar cada plugin.
- Feedback visual sobre o status da configuração (ex: sucesso, erro de conexão).

Sempre analisar, mapear e verificar codigo já existente para evitar retrabalho e garantir a integridade do sistema.

Agora preciso que crie um tasks_plugin_configuration.md com todas essas informaçoes para implementar essas funcionalidades.





o plugin Bigtech, não está aparecendo na pagina de plugins