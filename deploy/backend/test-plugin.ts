import { InfosimplesPlugin } from './src/plugins/consulta/infosimples/index';

async function testPlugin() {
  try {
    const plugin = new InfosimplesPlugin();
    const services = await plugin.getAvailableServices();

    console.log(`Loaded ${services.length} services`);
    console.log('First 5 services:');
    services.slice(0, 5).forEach(service => {
      console.log(`- ${service.id}: ${service.name} (${service.category}) - R$ ${service.price}`);
    });

    // Verificar serviços da Receita Federal
    const receitaServices = services.filter(s => s.id.includes('receita'));
    console.log(`\nServiços da Receita Federal (${receitaServices.length}):`);
    receitaServices.forEach(s => console.log(`- ${s.id}: ${s.name}`));

    // Verificar se receita-federal_cpf está presente
    const cpfService = services.find(s => s.id === 'receita-federal_cpf');
    if (cpfService) {
      console.log('receita-federal_cpf service found:', cpfService);
    } else {
      console.log('receita-federal_cpf not found');
    }

    // Verificar se cenprot-sp_protestos está presente
    const cenprotService = services.find(s => s.id === 'cenprot-sp_protestos');
    if (cenprotService) {
      console.log('cenprot-sp_protestos service found:', cenprotService);
    } else {
      console.log('cenprot-sp_protestos not found');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testPlugin();