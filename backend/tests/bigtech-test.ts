import { BigTechDataValidator } from '../src/plugins/consulta/bigtech/validator';

// Dados de teste do arquivo dadosteste.md
const testData = {
  '11-serasa-consumidor': [
    '09469124677', '96410620268', '20444257500', '03544386542', '20516630504'
  ],
  '1003-serasa-empresarial': [
    { cpfCnpj: '51072961000142', uf: '' },
    { cpfCnpj: '20163078000134', uf: '' },
    { cpfCnpj: '72500069000195', uf: '' }
  ]
};

async function testBigTechPlugin() {
  console.log('🚀 Iniciando testes do plugin BigTech com dados de dadosteste.md...\n');

  // Teste 1: Validação de entrada
  console.log('📋 Teste 1: Validação de entrada');
  for (const [serviceCode, testCases] of Object.entries(testData)) {
    console.log(`\n🔍 Testando serviço: ${serviceCode}`);

    for (const testCase of testCases) {
      try {
        let input: any;

        if (serviceCode === '11-serasa-consumidor') {
          input = {
            cpfCnpj: testCase as string,
            tipoPessoa: 'F'
          };
        } else if (serviceCode === '1003-serasa-empresarial') {
          input = {
            cpfCnpj: (testCase as any).cpfCnpj,
            uf: (testCase as any).uf,
            tipoPessoa: 'J'
          };
        }

        // Testa validação usando o método estático
        const validationResult = BigTechDataValidator.validateServiceInput(serviceCode, input);

        if (validationResult.isValid) {
          console.log(`✅ ${(testCase as any).cpfCnpj || testCase}: Validação OK`);
        } else {
          console.log(`❌ ${(testCase as any).cpfCnpj || testCase}: ${validationResult.errors.join(', ')}`);
        }

      } catch (error: any) {
        console.log(`❌ Erro ao testar ${(testCase as any).cpfCnpj || testCase}: ${error.message}`);
      }
    }
  }

  // Teste 2: Validação individual de CPF/CNPJ
  console.log('\n🔍 Teste 2: Validação individual de documentos');

  const cpfs = ['09469124677', '96410620268', '20444257500'];
  const cnpjs = ['51072961000142', '20163078000134'];

  console.log('\n📄 Testando CPFs:');
  cpfs.forEach(cpf => {
    const result = BigTechDataValidator.validateAndNormalizeCPF(cpf);
    console.log(`${cpf}: ${result.isValid ? '✅ Válido' : `❌ ${result.error}`}`);
  });

  console.log('\n🏢 Testando CNPJs:');
  cnpjs.forEach(cnpj => {
    const result = BigTechDataValidator.validateAndNormalizeCNPJ(cnpj);
    console.log(`${cnpj}: ${result.isValid ? '✅ Válido' : `❌ ${result.error}`}`);
  });

  console.log('\n🎉 Testes concluídos!');
}

// Executa os testes
testBigTechPlugin().catch(console.error);